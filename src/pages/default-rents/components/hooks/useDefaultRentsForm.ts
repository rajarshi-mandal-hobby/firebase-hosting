import { startTransition, useEffect, useEffectEvent, useState } from 'react';
import {
    calOutstanding,
    calTotalCharges,
    getPaymentStatus,
    setFormValues,
    toIndianLocale,
    toNumber
} from '../../../../shared/utils';
import { useForm } from '@mantine/form';
import { doc } from 'firebase/firestore';
import { type DefaultRents, DB, type Bed, type Member, type Floor, type Adjustment } from '../../../../data/types';
import { db, runTransactionWrapper } from '../../../../firebase';
import { useFormStore } from '../../../admin-dashboard/hooks/useFormStore';
import type { DefaultRentsFormProps, DefaultFormValuesTransformed, DefaultFormValues } from '../../types';
import dayjs from 'dayjs';

const isNumber = (val: unknown) => typeof val === 'number';
const validateNumber = (val: unknown) => (isNumber(val) ? null : 'Must be a number');
const validateFourOrFiveDigitNumber = (val: unknown) => {
    const validateNum = validateNumber(val);
    if (validateNum) return validateNum;
    const str = String(val);
    return str.length >= 4 && str.length <= 5 ? null : 'Must be a 4 or 5 digit number';
};
const validateFourDigitNumber = (val: unknown) => {
    const validateNum = validateNumber(val);
    if (validateNum) return validateNum;
    const str = String(val);
    return str.length === 4 ? null : 'Must be a 4 digit number';
};
const validateDoubleTheRent = (input: string | number, comparedTo: string | number) =>
    validateFourOrFiveDigitNumber(input)
    ?? (toNumber(input) >= toNumber(comparedTo) * 2 ? null : 'Must be double the rent');

export function useDefaultRentsForm({ defaultRents, onResetValues, members }: DefaultRentsFormProps) {
    const { clearFormState, retrieveFormState, onFormError, onFormSubmit, getFormName } =
        useFormStore<DefaultFormValuesTransformed>();
    const formState = retrieveFormState('default_rents', null);
    const draft = formState?.draft;
    const isPending = !!formState?.isPending;
    const hasError = !!formState?.hasError;
    const handleClearFormState = () => clearFormState('default_rents', null);

    const [currentBillDate] = useState(() => {
        if (!defaultRents) return null;
        return defaultRents.billDates.currentMonth.toDate();
    });

    const [applyFromNextMonth, setApplyFromNextMonth] = useState(true);

    const { rents, securityDeposit, wifiCharge } = defaultRents ?? {
        rents: {
            second: {
                single: '',
                double: '',
                special: ''
            },
            third: {
                single: '',
                double: ''
            }
        },
        wifiCharge: '',
        securityDeposit: ''
    };

    const form = useForm<DefaultFormValues, DefaultFormValuesTransformed>({
        mode: 'uncontrolled',
        initialValues: {
            secondBed: rents.second.single,
            secondRoom: rents.second.double,
            secondSpecial: rents.second.special,
            thirdBed: rents.third.single,
            thirdRoom: rents.third.double,
            securityDeposit: securityDeposit,
            wifiMonthlyCharge: wifiCharge
        },
        validate: {
            secondBed: validateFourDigitNumber,
            secondRoom: (val, { secondBed }) => validateDoubleTheRent(val, secondBed),
            secondSpecial: (val, { secondBed }) =>
                isNumber(val) && val < toNumber(secondBed) + 100 ?
                    'Must be at least ₹100 more than second bed rent'
                :   null,
            thirdBed: validateFourDigitNumber,
            thirdRoom: (val, { thirdBed }) => validateDoubleTheRent(val, thirdBed),
            securityDeposit: validateFourDigitNumber,
            wifiMonthlyCharge: (val) => (isNumber(val) && val >= 500 ? null : 'Minimum ₹500')
        },
        transformValues(values) {
            return Object.keys(values).reduce((acc, key) => {
                const targetKey = key as keyof DefaultFormValuesTransformed;
                acc[targetKey] = toNumber(values[targetKey]);
                return acc;
            }, {} as DefaultFormValuesTransformed);
        }
    });

    // Watch for changes in secondBed and update other fields accordingly
    form.watch('secondBed', ({ value }) => {
        if (typeof value !== 'number') return;
        const doubleRent = value * 2;
        setFormValues(form, {
            secondRoom: doubleRent,
            thirdBed: value,
            thirdRoom: doubleRent
        });
    });

    const evnt = useEffectEvent(() => {
        if (draft) {
            form.setValues(draft);
        }
    });

    useEffect(() => {
        evnt();
    }, []);

    const submitAction = async (values: DefaultFormValuesTransformed) => {
        onFormSubmit(values, 'default_rents', null);

        const updatedDefaultValues = {
            ...defaultRents?.billDates,
            rents: {
                second: {
                    single: values.secondBed,
                    double: values.secondRoom,
                    special: values.secondSpecial
                },
                third: {
                    single: values.thirdBed,
                    double: values.thirdRoom
                }
            },
            wifiCharge: values.wifiMonthlyCharge,
            securityDeposit: values.securityDeposit
        } satisfies Partial<DefaultRents>;

        await runTransactionWrapper(
            {
                formName: getFormName('default_rents'),
                loadingMessage: 'Saving Default Rents...',
                successMessage: 'Rents updated successfully!'
            },
            async (t) => {
                t.set(doc(db, DB.defaultValuesDoc), updatedDefaultValues, { merge: true });
                // Check if rents has increased
                const hasSecurityDepositChaged = defaultRents?.securityDeposit !== values.securityDeposit;
                const hasRentsChanged =
                    !!defaultRents
                    && Object.keys(updatedDefaultValues.rents).some((floor) => {
                        const defaultBeds = defaultRents.rents[floor as Floor] as Record<Bed, number> | undefined;
                        if (!defaultBeds) return true;

                        const updatedBeds = updatedDefaultValues.rents[floor as Floor] as Record<Bed, number>;
                        return Object.keys(updatedBeds).some(
                            (bed) => defaultBeds[bed as Bed] !== updatedBeds[bed as Bed]
                        );
                    });

                if (!(hasRentsChanged || hasSecurityDepositChaged)) return;

                // Update the members total deposit who are already staying in the mess
                members.forEach((m) => {
                    const updatedRent = (updatedDefaultValues.rents[m.floor] as Record<Bed, number>)[m.bed];
                    // It's very unlikely to get updated rent as undefined.
                    // But just in case, we throw an error so that it doesn't corrupt the DB.
                    if (!updatedRent) throw new Error(`Rent not found for member ${m.name}`);

                    // If the rents are applied from the next month, we just update the rent in the member document.
                    // The rent will be updated in the next month's bill.
                    if (applyFromNextMonth) {
                        const updatedMember = { ...m, rent: updatedRent };
                        t.update(doc(db, DB.memberCol, m.id), updatedMember);
                        return;
                    }

                    const rentChangedBy = updatedRent - m.rent;
                    const securityDeposit = values.securityDeposit;
                    const securityDepositChangedBy = securityDeposit - m.securityDeposit;

                    const currentMonthRent = m.currentMonthRent;
                    const updatedExpenses = [...currentMonthRent.adjustments];

                    if (rentChangedBy !== 0) {
                        const rentChangeByTxt = toIndianLocale(rentChangedBy);
                        const updatedAdvDeposit = toIndianLocale(updatedRent);
                        const rentCommonNote = `Your advance deposit of ${updatedAdvDeposit} will cover your final month's rent.`;
                        const rentNote =
                            rentChangedBy > 0 ?
                                `Due to a recent rent increase, your advance deposit also requires an additional ${rentChangeByTxt}. ${rentCommonNote}`
                            :   `Rent is decreased by ${rentChangeByTxt}. ${rentCommonNote}`;
                        updatedExpenses.push({
                            amount: rentChangedBy,
                            description: rentNote
                        });
                    }

                    if (securityDepositChangedBy !== 0) {
                        const securityDepositChangedByTxt = toIndianLocale(securityDepositChangedBy);
                        const securityDepositNote = `Security deposit ${securityDepositChangedBy > 0 ? 'increased' : 'decreased'} by ${securityDepositChangedByTxt}`;
                        updatedExpenses.push({
                            amount: securityDepositChangedBy,
                            description: securityDepositNote
                        });
                    }

                    const totalCharges = calTotalCharges(
                        updatedRent,
                        m.currentMonthRent.electricity,
                        m.currentMonthRent.wifi,
                        updatedExpenses,
                        m.currentMonthRent.prevOutstanding
                    );

                    const outstanding = calOutstanding(totalCharges, m.currentMonthRent.amountPaid);
                    const status = getPaymentStatus(m.currentMonthRent.amountPaid, totalCharges);

                    const updatedMember = {
                        currentMonthRent: {
                            ...m.currentMonthRent,
                            rent: updatedRent,
                            adjustments: updatedExpenses,
                            outstanding,
                            totalCharges,
                            paymentStatus: status
                        },
                        rent: updatedRent,
                        advanceDeposit: updatedRent,
                        securityDeposit
                    } satisfies Partial<Member>;
                    t.update(doc(db, DB.memberCol, m.id), updatedMember);
                });

                handleClearFormState();
                onResetValues();
                form.resetDirty();
            },
            {
                onError() {
                    onFormError('default_rents', null);
                }
            }
        );
    };

    return {
        form,
        isPending: isPending,
        hasError,
        currentBillDate,
        nextBillingMonth: currentBillDate && dayjs(currentBillDate).add(1, 'month').format('MMMM YY'),
        applyFromNextMonth,
        handleSave(values: DefaultFormValuesTransformed) {
            startTransition(async () => await submitAction(values));
        },
        handleFormReset() {
            form.reset();
        },
        handleClearError() {
            handleClearFormState();
        },
        handleApplyFromNextMonth(checked: boolean) {
            setApplyFromNextMonth(checked);
        }
    } as const;
}
