import dayjs from 'dayjs';
import { writeBatch, Timestamp, doc, collection } from 'firebase/firestore';
import { type Member, type Bill, type RentHistory, DB, RENT_HISTORY_DATE_FORMAT } from '../../../data/types';
import type { MemberFormDataTransformed, MemberFormSummary } from '../types';
import { db } from '../../../firebase';
import { calcTotalCharges, calcOutstanding, getPaymentStatus, toIndianLocale } from '../../../shared/utils';

interface AddMemberFnProp {
    formData: MemberFormDataTransformed & { logs: string[] };
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
    const { name, floor, bed, phone, moveInDate, optedForWifi, amountPaid, note, forwardOutstanding, logs } = formData;

    const batch = writeBatch(db);
    const timestampNow = Timestamp.now();
    const dayjsMoveInDate = dayjs(moveInDate);
    const memberDocRef = doc(collection(db, DB.memberCol));
    const memberId = memberDocRef.id;
    const moveInDateId = dayjsMoveInDate.format(RENT_HISTORY_DATE_FORMAT);

    // Create Fallback for Joining Month
    const joiningRentData = {
        id: moveInDateId,
        generatedAt: timestampNow,
        rent: summary.rent,
        electricity: 0,
        wifi: isPreviousDateSelected ? summary.prevWifi : summary.wifi,
        adjustments: [],
        totalCharges: summary.total,
        amountPaid,
        outstanding: forwardOutstanding ? summary.outstanding : 0,
        status:
            summary.outstanding && forwardOutstanding ?
                summary.outstanding > 0 ?
                    'Partial'
                :   'Overpaid'
            :   'Paid',
        remarks: [
            `Total Payable: ₹${summary.total} → Paid: ₹${amountPaid}${
                summary.outstanding ?
                    ` → Outstanding: ${toIndianLocale(summary.outstanding)}`
                    + (forwardOutstanding ? ' added ' : ' not added ')
                    + 'to current month'
                :   ''
            }`
        ]
    } as const satisfies RentHistory;

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
        logs,
        isActive: true,
        currentMonthRent: { ...joiningRentData }
    };

    // Process Billing Calculations (only for Previous Date or Wifi Opted)
    if (isPreviousDateSelected || optedForWifi) {
        const cmElectricData = { ...currentBillData.electric[floor] } as const;

        const uMonthRent = { ...member.currentMonthRent };
        let uElectricity = 0;

        if (optedForWifi) {
            uMonthRent.wifi = summary.wifi;
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
                wifi: uMonthRent.wifi,
                adjustments: uMonthRent.adjustments
            });

            uMonthRent.totalCharges = totalCharges;
            uMonthRent.amountPaid = 0;
            uMonthRent.outstanding = calcOutstanding(totalCharges, uMonthRent.amountPaid);
            uMonthRent.status = getPaymentStatus(uMonthRent.amountPaid, totalCharges);

            member.currentMonthRent = uMonthRent;
        }

        const memberFirstName = name.split(' ')[0];
        // Loop and Update Other Active Member Records
        for (const m of members) {
            if (!m.isActive) continue;

            const isSameFloor = m.floor === floor;
            const hasOptedForWifi = optedForWifi && m.optedForWifi;
            const mMonthRent = { ...m.currentMonthRent };
            const mWifi = hasOptedForWifi ? summary.wifi : mMonthRent.wifi;
            const mRemarks = [...(mMonthRent.remarks || [])];
            const openingRemark = 'The payment status was updated because the';
            const closingRemark = ` decreased following the inclusion of ${memberFirstName}.`;

            if (isSameFloor) {
                // Update electricity bill if previousMonth selected for the same floor
                // Skip any new member (who joined in the current billing month)
                const isNewMember = mMonthRent.electricity === 0;
                mMonthRent.electricity =
                    isPreviousDateSelected && !isNewMember ?
                        uElectricity || mMonthRent.electricity // uElectric can be 0
                    :   mMonthRent.electricity;
                mMonthRent.totalCharges = calcTotalCharges({
                    rent: m.rent,
                    electricity: mMonthRent.electricity,
                    wifi: mWifi,
                    adjustments: mMonthRent.adjustments
                });
                const mStatus = getPaymentStatus(mMonthRent.amountPaid, mMonthRent.totalCharges);
                mMonthRent.remarks =
                    mStatus === 'Paid' ? mRemarks : (
                        [
                            ...mRemarks,
                            `${openingRemark} electric ${optedForWifi ? 'and wifi bills' : 'bill'} ${closingRemark}`
                        ]
                    );
            } else if (!isSameFloor && optedForWifi && m.optedForWifi) {
                // Update wifi bill ONLY for different floor members
                const exccessWifi = mMonthRent.wifi - mWifi;
                mMonthRent.totalCharges = mMonthRent.totalCharges - exccessWifi;
                const mStatus = getPaymentStatus(mMonthRent.amountPaid, mMonthRent.totalCharges);
                mMonthRent.remarks =
                    mStatus === 'Paid' ?
                        mMonthRent.remarks
                    :   [...mRemarks, `${openingRemark} wifi bill ${closingRemark}`];
            } else {
                // Skip all others
                continue;
            }

            mMonthRent.wifi = mWifi;
            mMonthRent.outstanding = calcOutstanding(mMonthRent.totalCharges, mMonthRent.amountPaid);

            console.log('updatedRentHistory', m.name, mMonthRent);
            // Queue member update
            batch.update(doc(db, DB.memberCol, m.id), { currentMonthRent: mMonthRent });
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

    console.log('member', member);
    console.log('joining history', joiningRentData);
    // await batch.commit();
    return member;
};
