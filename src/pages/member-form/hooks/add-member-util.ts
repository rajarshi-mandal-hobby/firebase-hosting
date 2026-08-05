import dayjs from 'dayjs';
import { writeBatch, Timestamp, doc, collection } from 'firebase/firestore';
import { type Member, type Bill, type RentHistory, DB, RENT_HISTORY_DATE_FORMAT } from '../../../data/types';
import type { MemberFormDataTransformed, MemberFormSummary } from '../types';
import { db } from '../../../firebase';
import { calcTotalCharges, calcOutstanding, getPaymentStatus } from '../../../shared/utils';

interface AddMemberFnProp {
    formData: MemberFormDataTransformed;
    members: Member[];
    summary: MemberFormSummary;
    isPreviousDateSelected: boolean;
    currentBillData: Bill;
}

export const addMember = async ({
    formData,
    members,
    summary,
    isPreviousDateSelected,
    currentBillData
}: AddMemberFnProp) => {
    const { name, floor, bed, phone, moveInDate, optedForWifi, amountPaid, note, forwardOutstanding } = formData;

    const batch = writeBatch(db);
    const timestampNow = Timestamp.now();
    const dayjsMoveInDate = dayjs(moveInDate);
    const memberDocRef = doc(collection(db, DB.memberCol));
    const memberId = memberDocRef.id;
    const moveInDateId = dayjsMoveInDate.format(RENT_HISTORY_DATE_FORMAT);

    // Create Fallback for Joining Month
    const joiningRentData: RentHistory = {
        id: moveInDateId,
        generatedAt: timestampNow,
        rent: summary.rent,
        electricity: 0,
        wifi: summary.wifi,
        adjustments: [],
        totalCharges: summary.total,
        amountPaid,
        outstanding: forwardOutstanding ? summary.outstanding : 0,
        note: note,
        paymentStatus: forwardOutstanding ? getPaymentStatus(amountPaid, summary.total) : 'Paid'
    };

    // Member Data
    const member: Member = {
        id: memberId,
        name,
        phone,
        moveInDate: Timestamp.fromDate(dayjsMoveInDate.startOf('month').toDate()),
        floor,
        bed,
        rent: summary.rent,
        advanceDeposit: summary.rent,
        securityDeposit: summary.securityDeposit,
        totalAgreedDeposit: summary.totalDeposit,
        optedForWifi,
        remarks: note,
        isActive: true,
        currentMonthRent: { ...joiningRentData }
    };

    // Process Billing Calculations (only for Previous Date or Wifi Opted)
    if (isPreviousDateSelected || optedForWifi) {
        const cmElectricData = { ...currentBillData.electric[floor] } as const;
        if (!cmElectricData) {
            throw new Error(`Failed to add member: Previous electric bill data for floor ${floor} is missing.`);
        }

        const uMonthRent: RentHistory = { ...joiningRentData };
        let uElectricity = 0;
        let uWifi = 0;

        if (optedForWifi) {
            // Split wifi costs between all the wifi members
            const wifiMembersCount = currentBillData.wifi.members.length + (optedForWifi ? 1 : 0);
            uWifi = wifiMembersCount > 0 ? Math.ceil(currentBillData.wifi.totalAmount / wifiMembersCount) : 0;
            uMonthRent.wifi = uWifi;
            // Update the Joining Rent History
            // summary.wifi totals the wifi amount for all the months including the current month
            // so we need to subtract the current month's wifi amount from it
            if (isPreviousDateSelected) {
                joiningRentData.wifi = summary.wifi - uWifi;
                joiningRentData.outstanding = summary.outstanding - uWifi;
                joiningRentData.totalCharges = summary.total - uWifi;
                joiningRentData.paymentStatus = getPaymentStatus(amountPaid, joiningRentData.totalCharges);
            }
        }

        if (isPreviousDateSelected) {
            // Update the Joining Rent History id to current month's bill id
            uMonthRent.id = currentBillData.id;
            // Add any previous outstanding
            if (joiningRentData.outstanding) {
                uMonthRent.adjustments = [
                    ...uMonthRent.adjustments,
                    {
                        amount: joiningRentData.outstanding,
                        description: joiningRentData.outstanding > 0 ? 'Previous Month Outstanding' : 'Overpaid'
                    }
                ];
            }

            // Split electricity cost for current month for current floor
            // The total number of members doesn't include the new joining members of the current month
            const floorMembersCount = cmElectricData.members.length + 1;
            uElectricity = Math.ceil(cmElectricData.totalAmount / floorMembersCount);
            uMonthRent.electricity = uElectricity;

            const totalCharges = calcTotalCharges({
                rent: summary.rent,
                electricity: uElectricity,
                wifi: uWifi,
                adjustments: uMonthRent.adjustments
            });
            uMonthRent.totalCharges = totalCharges;

            uMonthRent.amountPaid = 0;

            const outstanding = calcOutstanding(totalCharges, uMonthRent.amountPaid);
            uMonthRent.outstanding = outstanding;

            uMonthRent.paymentStatus =
                outstanding === 0 ? 'Paid'
                : outstanding < 0 ? 'Overpaid'
                : outstanding > 0 && outstanding < totalCharges ? 'Partial'
                : 'Due';

            member.currentMonthRent = uMonthRent;
        }

        // Loop and Update Other Active Member Records
        for (const m of members) {
            if (!m.isActive) continue;

            const isSameFloor = m.floor === floor;
            const mMonthRent = m.currentMonthRent;
            let mElectricity = mMonthRent.electricity;
            let mWifi = mMonthRent.wifi;
            let mTotalCharges: number;

            if (isSameFloor) {
                // Update electricity bill if previousMonth selected for the same floor
                // Skip any new member (who joined in the current billing month)
                const isNewMember = mElectricity === 0;
                if (isPreviousDateSelected && !isNewMember) mElectricity = uElectricity;
                if (optedForWifi && m.optedForWifi) mWifi = uWifi;
                mTotalCharges = calcTotalCharges({
                    rent: m.rent,
                    electricity: mElectricity,
                    wifi: mWifi,
                    adjustments: mMonthRent.adjustments
                });
            } else if (!isSameFloor && optedForWifi && m.optedForWifi) {
                // Update wifi bill ONLY for different floor members
                mWifi = uWifi;
                const exccessWifi = mMonthRent.wifi - uWifi;
                mTotalCharges = mMonthRent.totalCharges - exccessWifi;
            } else {
                // Skip all others
                continue;
            }

            const mStatus = getPaymentStatus(mMonthRent.amountPaid, mTotalCharges);
            const mOutstanding = calcOutstanding(mTotalCharges, mMonthRent.amountPaid);
            const mUpdatedNote =
                !mMonthRent.note.trim() ? ''
                : mMonthRent.note.endsWith('.') ? mMonthRent.note + ' '
                : mMonthRent.note + '. ';
            const mNote =
                mStatus === 'Paid' ? '' : mUpdatedNote + `Payment status changed as ${name.split(' ')[0]} joined.`;

            const updatedRentHistory: RentHistory = {
                ...mMonthRent,
                generatedAt: timestampNow,
                totalCharges: mTotalCharges,
                electricity: mElectricity,
                wifi: mWifi,
                outstanding: mOutstanding,
                paymentStatus: mStatus,
                note: mNote
            };

            // Queue member update
            batch.update(doc(db, DB.memberCol, m.id), { currentMonthRent: updatedRentHistory });
        }

        // Update Global Bills and Maps Data Structure
        const updatedBill: Bill = { ...currentBillData };
        updatedBill.idNameMap = {
            ...currentBillData.idNameMap,
            [memberId]: name
        };

        if (isPreviousDateSelected) {
            updatedBill.electric = {
                ...updatedBill.electric,
                [floor]: {
                    ...cmElectricData,
                    members: [...cmElectricData.members, memberId]
                }
            };
        }

        if (optedForWifi) {
            updatedBill.wifi = {
                ...currentBillData.wifi,
                members: [...currentBillData.wifi.members, memberId]
            };
        }

        batch.update(doc(db, DB.rentsAndBillsDoc), { ...updatedBill });
    }

    // Perform Atomic Writes
    batch.set(memberDocRef, member);

    if (isPreviousDateSelected) {
        const rentHistoryDocRef = doc(db, DB.memberCol, memberId, DB.rentHistoryCol, moveInDateId);
        batch.set(rentHistoryDocRef, joiningRentData);
    }

    console.log('member', member.currentMonthRent);
    console.log('joining history', joiningRentData);
    // await batch.commit();
    return member;
};
