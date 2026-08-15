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
import { calcTotalAdjustments, calcTotalCharges } from '../../../shared/utils/member-utils';

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

    const [summary, setSummary] = useState<MemberFormSummary>({
        rent: member?.rent ?? 0,
        securityDeposit: member?.securityDeposit ?? 0,
        totalDeposit: member?.totalAgreedDeposit ?? 0,
        wifi: 0,
        prevWifi: 0,
        outstanding: 0,
        total: 0
    });

    const resetSummary = () => {
        setSummary({
            rent: member?.rent ?? 0,
            securityDeposit: member?.securityDeposit ?? 0,
            totalDeposit: member?.totalAgreedDeposit ?? 0,
            outstanding: 0,
            wifi: 0,
            prevWifi: 0,
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
                    outstanding: prev.wifi + prev.prevWifi
                }));
            }

            if (!!floor && bed !== previous.bed) {
                const floorRent = defaultRents.rents[floor] as Record<Bed, number>;
                const rent = bed && bed in floorRent ? floorRent[bed] : 0;
                const securityDeposit = rent ? defaultRents.securityDeposit : 0;
                const totalDeposit = calcTotalDeposit(rent, securityDeposit);

                let outstanding = totalDeposit;
                let total = 0;
                if (isEditing) {
                    outstanding = totalDeposit - member.totalAgreedDeposit;
                } else {
                    outstanding = totalDeposit + rent + summary.wifi + summary.prevWifi;
                    total = outstanding;
                    console.log('outstanding', total);
                }

                setFormValues(form, {
                    amountPaid: isEditing ? outstanding || '' : '',
                    forwardOutstanding: !isString(amountPaid)
                });

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
                let prevWifi = 0;

                if (optedForWifi && !member?.optedForWifi) {
                    const wifiAmount = currentMonthBillData.wifi.totalAmount;
                    const totalWifiMembers = currentMonthBillData.wifi.members.length + 1;
                    wifi = Math.ceil(wifiAmount / totalWifiMembers);

                    const isPrevMonth = !dayjs(moveInDate).isSame(currentBillingDate, 'month');
                    if (isPrevMonth && !isEditing) {
                        const prevWifiAmount = prevMonthBillData.wifi.totalAmount;
                        const prevTotalWifiMembers = prevMonthBillData.wifi.members.length + 1;
                        prevWifi = Math.ceil(prevWifiAmount / prevTotalWifiMembers);
                    }
                } else {
                    wifi = 0;
                    prevWifi = 0;
                }

                let outstanding = summary.totalDeposit;
                let total = 0;
                if (isEditing) {
                    outstanding = summary.totalDeposit - member.totalAgreedDeposit;
                } else {
                    outstanding = summary.totalDeposit + summary.rent + wifi + prevWifi;
                    total = outstanding;
                }

                setFormValues(form, {
                    amountPaid: isEditing ? outstanding || '' : ''
                });

                setSummary((prev) => ({
                    ...prev,
                    wifi,
                    prevWifi,
                    outstanding,
                    total
                }));
            }

            if (!isEditing && amountPaid !== previous.amountPaid) {
                startTransition(() => {
                    const outstanding = isString(amountPaid) ? summary.total : summary.total - amountPaid;
                    form.setFieldValue('forwardOutstanding', !isString(amountPaid) && !!outstanding);
                    setSummary((prev) => ({ ...prev, outstanding }));
                });
            }

            const isRecalculateDisabled = (isEditing && member.floor === floor && member.bed === bed) || !floor || !bed;
            if (isRecalculateDisabled) {
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
            const hasBedChanged = bed !== member.bed;
            const hasFloorChanged = floor !== member.floor;

            const monthRent = { ...updatedMember.currentMonthRent };
            const remarks: string[] = [...(monthRent.remarks || [])];

            if (recalculate || hasOptedForWifi) {
                monthRent.generatedAt = timestampNow;

                if (hasOptedForWifi) {
                    monthRent.wifi = summary.wifi;
                    remarks.push('Opted for wifi.');
                }

                // Get the electric data of each floor, remove the member from the current floor and add him to the selected floor
                let recalculatedElectricBills: Record<Floor, number> | null = null;
                if (recalculate) {
                    if (hasFloorChanged) {
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
                                const totalFloorMembers = electricData.members.length || 1;
                                const electricity = Math.ceil(electricData.totalAmount / totalFloorMembers);
                                return { ...acc, [_floor]: electricity };
                            },
                            {} as Record<Floor, number>
                        );

                        monthRent.electricity = recalculatedElectricBills[updatedMember.floor];
                        remarks.push(
                            `Electric bill updated to ₹${monthRent.electricity} due to shift to ${FLOOR_LABEL[updatedMember.floor]} floor.`
                        );
                    }

                    // Upddate the member's current month rent based on the new rent
                    monthRent.rent = summary.rent;

                    if (hasBedChanged) {
                        remarks.push(
                            `Rent updated from ₹${member.rent} to ₹${updatedMember.rent} due to bed changed to ${BED_LABEL[bed]}.`
                        );
                    }
                }

                // Loop and Update Other Active Member Records
                const updatedMemberFirstname = name.split(' ')[0];
                for (const m of members) {
                    if (!m.isActive || m.id === member.id) continue;

                    const mMonthRent = {
                        ...m.currentMonthRent,
                        generatedAt: timestampNow
                    };

                    let shouldUpdate = false;

                    const mRemarks = [...(m.logs ?? [])];

                    let mElectricity = mMonthRent.electricity;
                    if (recalculate && recalculatedElectricBills) {
                        const isMemberNew = mMonthRent.electricity === 0;
                        mElectricity = isMemberNew ? 0 : recalculatedElectricBills[m.floor];

                        const electricDiff = mElectricity - mMonthRent.electricity;
                        if (electricDiff) {
                            shouldUpdate = true;
                        }
                    }

                    let mWifi = mMonthRent.wifi;
                    if (hasOptedForWifi && m.optedForWifi) {
                        mWifi = summary.wifi;

                        const wifiDiff = mWifi - mMonthRent.wifi;
                        if (wifiDiff) {
                            shouldUpdate = true;
                        }
                    }

                    // If no change, continue to next member
                    if (!shouldUpdate) continue;

                    const mTotalCharges = calcTotalCharges({
                        rent: m.rent,
                        wifi: mWifi,
                        electricity: mElectricity,
                        adjustments: mMonthRent.adjustments
                    });
                    const mStatus = getPaymentStatus(mMonthRent.amountPaid, mTotalCharges);
                    const mOutstanding = calcOutstanding(mTotalCharges, mMonthRent.amountPaid);

                    const opening = `${mMonthRent.status !== mStatus ? 'Payment status' : 'Charges'} changed as ${updatedMemberFirstname}`;
                    const flTxt = ` shifted from ${FLOOR_LABEL[member.floor]} to ${FLOOR_LABEL[floor]} floor`;
                    const wifiTxt = ` opted for wifi`;
                    const closing =
                        hasFloorChanged && hasOptedForWifi && m.optedForWifi ? flTxt + ' and' + wifiTxt + '.'
                        : hasOptedForWifi && m.optedForWifi ? wifiTxt + '.'
                        : flTxt + '.';
                    mRemarks.push(opening + closing);

                    const updatedHistory: RentHistory = {
                        ...mMonthRent,
                        electricity: mElectricity,
                        wifi: mWifi,
                        totalCharges: mTotalCharges,
                        status: mStatus,
                        outstanding: mOutstanding,
                        remarks: mRemarks
                    };

                    console.log('updated history', m.name, m.floor, updatedHistory);
                }
            }

            // The total advance deposit amount has changed
            if (amountPaid) {
                const msg = `Total advance deposit has changed from ${toIndianLocale(member.totalAgreedDeposit)} to ${toIndianLocale(summary.totalDeposit)} creating ${amountPaid > 0 ? 'an excess' : 'a deficiency'} of ${toIndianLocale(amountPaid)}`;
                if (forwardOutstanding) {
                    monthRent.adjustments = [
                        ...monthRent.adjustments,
                        {
                            amount: amountPaid,
                            description: `${msg} which has been adjusted with the current month's rent.`
                        }
                    ];
                } else {
                    remarks.push(`${msg} which has been paid upfront.`);
                }
            }

            const totalCharges = calcTotalCharges({
                rent: monthRent.rent,
                electricity: monthRent.electricity,
                wifi: monthRent.wifi,
                adjustments: monthRent.adjustments
            });
            monthRent.totalCharges = totalCharges;

            const totalChargesDiff = totalCharges - monthRent.totalCharges;
            if (totalChargesDiff) {
                remarks.push(
                    `Total charges changed from ${toIndianLocale(monthRent.totalCharges)} to ${toIndianLocale(totalCharges)}.`
                );
            }

            monthRent.status = getPaymentStatus(monthRent.amountPaid, totalCharges);
            if (member.currentMonthRent.status !== monthRent.status) {
                remarks.push('Status changed due to updation.');
            }
            monthRent.outstanding = calcOutstanding(totalCharges, monthRent.amountPaid);
            monthRent.remarks = remarks;
            updatedMember.currentMonthRent = monthRent;

            console.log('updated member after recalculation', updatedMember);
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
