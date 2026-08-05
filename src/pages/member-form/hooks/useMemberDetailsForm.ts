import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { calcTotalDeposit, getInitialValues, normalizeNameInput } from '../utils/utils';
import {
    BED,
    BED_LABEL,
    FLOOR,
    FLOOR_LABEL,
    FORM_DATE_FORMAT,
    type Bed,
    type Adjustment,
    type Floor,
    type Member,
    type RentHistory
} from '../../../data/types';
import { useState, startTransition, useTransition } from 'react';
import {
    setFormValues,
    normalizePhoneInput,
    isString,
    toNumber,
    hasTwoWords,
    getPaymentStatus,
    calcOutstanding,
    toIndianLocale
} from '../../../shared/utils';
import type { MemberDetailsFormProps, MemberFormSummary, MemberFormData, MemberFormDataTransformed } from '../types';
import { Timestamp } from 'firebase/firestore';
import { addMember } from './add-member-util';
import { calcTotalAdjustments } from '../../../shared/utils/member-utils';

export const useMemberDetailsForm = ({ rentsAndBills, member, members, memberAction }: MemberDetailsFormProps) => {
    const isAdding = memberAction === 'add';
    const isEditing = !!member && memberAction === 'edit';
    const isReactivating = !!member && memberAction === 'reactivate';

    const currentMonthBillData = rentsAndBills.bills.currentMonth;
    const prevMonthBillData = rentsAndBills.bills.previousMonth;
    const defaultRents = rentsAndBills.defaults;
    const currentBillingDate = dayjs(currentMonthBillData.generatedAt.toDate())
        .startOf('month')
        .format(FORM_DATE_FORMAT);

    const [isPending, startAction] = useTransition();

    const [summary, setSummary] = useState<MemberFormSummary>(() => ({
        rent: member?.rent ?? 0,
        securityDeposit: member?.securityDeposit ?? 0,
        totalDeposit: member?.totalAgreedDeposit ?? 0,
        wifi: 0,
        outstanding: 0,
        total: 0
    }));

    const resetSummary = () => {
        setSummary({
            rent: member?.rent ?? 0,
            securityDeposit: member?.securityDeposit ?? 0,
            totalDeposit: member?.totalAgreedDeposit ?? 0,
            outstanding: 0,
            wifi: 0,
            total: 0
        });
    };

    const form = useForm<MemberFormData, MemberFormDataTransformed>({
        mode: 'uncontrolled',
        initialValues: getInitialValues(member, memberAction, currentBillingDate),
        onValuesChange(values, previous) {
            const { floor, bed, amountPaid, optedForWifi, moveInDate } = values;

            if (floor !== previous.floor) {
                setFormValues(form, {
                    bed: null,
                    amountPaid: ''
                });

                setSummary((prev) => ({
                    ...prev,
                    rent: 0,
                    securityDeposit: 0,
                    totalDeposit: 0,
                    outstanding: 0,
                    total: prev.wifi
                }));
            }

            if (!!floor && bed !== previous.bed) {
                const floorRent = defaultRents.rents[floor] as Record<Bed, number>;
                const rent = bed && bed in floorRent ? floorRent[bed] : 0;
                const securityDeposit = rent ? defaultRents.securityDeposit : 0;
                const totalDeposit = calcTotalDeposit(rent, securityDeposit);
                let total = totalDeposit + summary.wifi;

                let outstanding = 0;
                if (isEditing) {
                    total = total - member.totalAgreedDeposit;
                    outstanding = total;
                    console.log('outstanding', outstanding);
                    setFormValues(form, {
                        amountPaid: outstanding === 0 ? '' : outstanding,
                        forwardOutstanding: outstanding !== 0
                    });
                } else {
                    setFormValues(form, {
                        amountPaid: '',
                        forwardOutstanding: false
                    });
                }

                setSummary((prev) => ({
                    ...prev,
                    rent,
                    securityDeposit,
                    totalDeposit,
                    outstanding,
                    total
                }));
            }

            if (optedForWifi !== previous.optedForWifi || moveInDate !== previous.moveInDate) {
                let wifi = 0;

                if (optedForWifi && !member?.optedForWifi) {
                    const wifiAmount = currentMonthBillData.wifi.totalAmount;
                    const totalWifiMembers = currentMonthBillData.wifi.members.length + 1;
                    wifi = Math.ceil(wifiAmount / totalWifiMembers);

                    const isPrevMonth = !dayjs(moveInDate).isSame(currentBillingDate, 'month');
                    if (isPrevMonth && !isEditing) {
                        const prevWifiAmount = prevMonthBillData.wifi.totalAmount;
                        const prevTotalWifiMembers = prevMonthBillData.wifi.members.length + 1;
                        wifi += Math.ceil(prevWifiAmount / prevTotalWifiMembers);
                    }
                } else {
                    wifi = 0;
                }

                // const total = summary.totalDeposit + wifi;
                let total = summary.totalDeposit + wifi;
                let outstanding = 0;

                if (isEditing) {
                    total -= member.totalAgreedDeposit;
                    outstanding = total;
                    setFormValues(form, {
                        amountPaid: outstanding || '',
                        forwardOutstanding: outstanding !== 0
                    });
                } else {
                    setFormValues(form, {
                        amountPaid: '',
                        forwardOutstanding: false
                    });
                }

                setSummary((prev) => ({
                    ...prev,
                    wifi,
                    total,
                    outstanding
                }));
            }

            if (!isEditing && amountPaid !== previous.amountPaid) {
                startTransition(() => {
                    const outstanding = isString(amountPaid) ? 0 : summary.total - amountPaid;
                    form.setFieldValue('forwardOutstanding', outstanding !== 0);

                    setSummary((prev) => ({ ...prev, outstanding }));
                });
            }

            if (isEditing && (floor === member.floor || !bed)) {
                form.setFieldValue('recalculate', false);
            }
        },
        validateInputOnBlur: true,
        validate: {
            name(value) {
                const normalized = normalizeNameInput(value);
                if (!hasTwoWords(normalized)) {
                    return 'Name must contain at least two words.';
                }

                return null;
            },
            phone(value) {
                const phoneNumber = normalizePhoneInput(value);
                if (phoneNumber.length !== 10) {
                    return 'Phone number must be 10 digits.';
                }

                let memberWithSamePhone = '';
                const memberExists = members.some((m) => {
                    if (m.id === member?.id) {
                        return false;
                    }
                    const memberPhone = normalizePhoneInput(m.phone);
                    const doesExist = memberPhone === phoneNumber;
                    if (doesExist) {
                        memberWithSamePhone = m.name;
                    }
                    return doesExist;
                });

                // return memberExists ? `${memberWithSamePhone} has this phone number` : null;
                return null;
            },
            floor: (value) => (!value ? 'Floor is required.' : null),
            bed: (value) => (!value ? 'Bed is required.' : null),
            amountPaid: (value) => (!isEditing && toNumber(value) === 0 ? 'Payment is required.' : null)
        },
        transformValues: (values) => ({
            moveInDate: values.moveInDate,
            id: values.id,
            name: normalizeNameInput(values.name),
            phone: normalizePhoneInput(values.phone),
            optedForWifi: values.optedForWifi,
            floor: values.floor as Floor,
            bed: values.bed as Bed,
            amountPaid: toNumber(values.amountPaid),
            forwardOutstanding: values.forwardOutstanding,
            recalculate: values.recalculate,
            note: values.note.trim()
        })
    });

    const formValues = form.getValues();

    const maxDate = currentBillingDate;
    const minDate = dayjs(currentBillingDate).subtract(1, 'month').format(FORM_DATE_FORMAT);

    const currentcalendarMonth = dayjs();
    const isPreviousDateSelected = formValues.moveInDate === minDate;
    const canEdit = isAdding || (!!member && dayjs(member.moveInDate.toDate()).isSame(currentBillingDate, 'month'));

    const onConfirm = async (formData: MemberFormDataTransformed) => {
        const { name, floor, bed, phone, moveInDate, optedForWifi, amountPaid, note, recalculate, forwardOutstanding } =
            formData;

        if (isAdding) {
            addMember({ formData, members, summary, isPreviousDateSelected, currentBillData: currentMonthBillData });
        }

        if (isEditing) {
            const timestampNow = Timestamp.now();
            // Update standalone member
            const updatedMember: Member = { ...member };
            updatedMember.moveInDate = Timestamp.fromDate(dayjs(moveInDate).startOf('M').toDate());
            updatedMember.updatedAt = timestampNow;
            updatedMember.name = name;
            updatedMember.floor = floor;
            updatedMember.phone = phone;
            updatedMember.optedForWifi = optedForWifi;
            updatedMember.bed = bed;
            updatedMember.floor = floor;
            updatedMember.rent = summary.rent;
            updatedMember.advanceDeposit = summary.rent;
            updatedMember.securityDeposit = summary.securityDeposit;
            updatedMember.totalAgreedDeposit = summary.totalDeposit;

            // Member has opted for wifi
            const hasOptedForWifi = !member.optedForWifi && optedForWifi;

            if (forwardOutstanding) {
                const monthRent = { ...member.currentMonthRent };
                const adjustments = [...monthRent.adjustments];
                if (hasOptedForWifi) {
                    adjustments.push({
                        amount: summary.wifi,
                        description: 'Opted for wifi'
                    });
                }
                const hasBedChanged = bed !== member.bed;
                if (hasBedChanged) {
                    adjustments.push({
                        amount: summary.rent,
                        description: `Changed bed to ${BED_LABEL[bed]}`
                    });
                }

                const totalCharges = monthRent.totalCharges + amountPaid;
                monthRent.status = getPaymentStatus(monthRent.amountPaid, totalCharges);
                monthRent.outstanding = calcOutstanding(totalCharges, monthRent.amountPaid);
                const paymentNote = monthRent.status === 'Paid' ? '' : 'Status changed due to updation.';
                updatedMember.currentMonthRent = {
                    ...monthRent,
                    totalCharges,
                    adjustments,
                    note: paymentNote
                };
            }

            console.log('updated member', updatedMember.currentMonthRent);

            // If the floor is changed or member has opted for wifi, then update the electric or wifi bills of all active members.
            if (recalculate || hasOptedForWifi) {
                let recalculatedElectricBills = {} as Record<Floor, number>;
                if (recalculate) {
                    // Get the electric data of each floor, remove the member from the current floor and add him to the selected floor
                    const uElectricData = Object.fromEntries(
                        Object.entries(currentMonthBillData.electric).map(([_floor, memberMap]) => {
                            let updatedMembers = [...memberMap.members];
                            if (_floor === floor) {
                                updatedMembers.push(member.id);
                            } else {
                                updatedMembers = updatedMembers.filter((m) => m !== member.id);
                            }
                            return [_floor, { ...memberMap, members: updatedMembers }];
                        })
                    ) as Record<Floor, { totalAmount: number; members: string[] }>;

                    // Calculate bills for each floor
                    recalculatedElectricBills = Object.entries(uElectricData).reduce(
                        (acc, [_floor, electricData]) => {
                            const totalFloorMembers = electricData.members.length;
                            const electricity = Math.ceil(electricData.totalAmount / totalFloorMembers);
                            return { ...acc, [_floor]: electricity };
                        },
                        {} as Record<Floor, number>
                    );

                    // Update the member
                    const monthRent = updatedMember.currentMonthRent;
                    const electricDiff = recalculatedElectricBills[updatedMember.floor] - monthRent.electricity;
                    const adjustments = [
                        ...monthRent.adjustments,
                        {
                            amount: electricDiff,
                            description: `Electric bill changed from ${toIndianLocale(monthRent.electricity)} to ${toIndianLocale(recalculatedElectricBills[updatedMember.floor])} due to floor change.`
                        }
                    ];
                    const totalCharges = monthRent.totalCharges + electricDiff;
                    const status = getPaymentStatus(monthRent.amountPaid, totalCharges);
                    const outstanding = calcOutstanding(totalCharges, monthRent.amountPaid);

                    updatedMember.currentMonthRent = {
                        ...monthRent,
                        adjustments,
                        totalCharges,
                        status,
                        outstanding,
                        note: status === 'Paid' ? '' : 'Status changed due to updation.'
                    };
                }

                console.log('updated member after recalculation', updatedMember.currentMonthRent);

                // Loop and Update Other Active Member Records
                for (const m of members) {
                    if (!m.isActive || m.id === member.id) continue;

                    const mMonthRent = {
                        ...m.currentMonthRent,
                        generatedAt: timestampNow
                    } as const satisfies RentHistory;

                    let shouldUpdate = false;
                    const isMemberSame = m.id === member.id;

                    const isMemberNew = mMonthRent.electricity === 0;

                    const mElectricity =
                        isMemberNew ? 0 : (recalculatedElectricBills[m.floor] ?? mMonthRent.electricity);
                    const mWifi = hasOptedForWifi && m.optedForWifi ? summary.wifi : mMonthRent.wifi;

                    const mAdjustments: Adjustment[] = [...mMonthRent.adjustments];

                    const electricDiff = mElectricity - mMonthRent.electricity;
                    if (electricDiff) {
                        mAdjustments.push({
                            amount: electricDiff,
                            description:
                                `${name.split(' ')[0]} shifted from ${FLOOR_LABEL[member.floor]} to ${FLOOR_LABEL[floor]} floor.`
                                + `The electricity bill changed from ${toIndianLocale(mMonthRent.electricity)} to ${toIndianLocale(mElectricity)}. `
                        });

                        shouldUpdate = true;
                    }

                    const wifiDiff = mWifi - mMonthRent.wifi;
                    if (wifiDiff) {
                        mAdjustments.push({
                            amount: wifiDiff,
                            description:
                                `${name.split(' ')[0]} ${optedForWifi ? 'added' : 'removed'} wifi.`
                                + `The wifi charge changed from ${toIndianLocale(mMonthRent.wifi)} to ${toIndianLocale(mWifi)}.`
                        });

                        shouldUpdate = true;
                    }

                    // If no change, continue to next member
                    if (!shouldUpdate) continue;

                    const mTotalCharges = mMonthRent.totalCharges + calcTotalAdjustments(mAdjustments);
                    const mStatus = getPaymentStatus(mMonthRent.amountPaid, mTotalCharges);
                    const mOutstanding = calcOutstanding(mTotalCharges, mMonthRent.amountPaid);

                    const updatedNote = () =>
                        !mMonthRent.note.trim() ? ''
                        : mMonthRent.note.endsWith('.') ? mMonthRent.note + ' '
                        : mMonthRent.note + '. ';
                    const mNote =
                        mStatus === 'Paid' ? '' : (
                            updatedNote() + `Payment status changed as ${name.split(' ')[0]} changed floor.`
                        );

                    const updatedHistory: RentHistory = {
                        ...mMonthRent,
                        electricity: mElectricity,
                        wifi: mWifi,
                        adjustments: mAdjustments,
                        totalCharges: mTotalCharges,
                        status: mStatus,
                        outstanding: mOutstanding,
                        note: mNote
                    };

                    console.log('updated history', m.name, m.floor, updatedHistory);
                }
            }
        }
    };

    return {
        summary,
        members,
        isPending,
        isButtonDisabled: !form.isDirty() || isPending,
        memberActions: {
            isAdding,
            isEditing,
            isReactivating
        },
        calendarEvents: {
            lastBillDate: dayjs(currentBillingDate).format('MMMM YY'),
            calendarMonth: currentcalendarMonth.format('MMMM YY'),
            isPreviousDateSelected,
            isBillingMonthSameAscalendarMonth: currentcalendarMonth.isSame(currentBillingDate, 'month'),
            canEdit
        },
        formConfig: {
            form,
            formValues,
            secondFloorSelectData: Object.entries(FLOOR_LABEL)
                .filter(([key, _]) => key !== FLOOR.all)
                .map(([key, value]) => ({
                    value: key,
                    label: `${value} Floor`
                })),
            thirdFlSelectData: Object.entries(BED_LABEL).map(([key, value]) => ({
                value: key,
                label: value,
                disabled: formValues.floor === FLOOR.third && key === BED.special
            })),
            minDate,
            maxDate
        },
        actions: {
            handleConfirm(values: MemberFormDataTransformed) {
                startAction(async () => {
                    await onConfirm(values);
                });
            },
            handleFormReset() {
                form.reset();
                resetSummary();
            }
        }
    };
};
