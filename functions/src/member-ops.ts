import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import dayjs from 'dayjs';
import { BedType, BedTypes, DEFAULT_COL, DefaultValues, ELECTRIC_BILLS_COL, ElectricBill, Floor, Floors, Member, MemberAction, MEMBERS_COL, RENT_HISTORY_COL, RentHistory, SaveResponse, VALUES_DOC } from './types/index.js';
import { logger } from 'firebase-functions';
import { db } from './index.js';
import { FourDigitSchema, IntegerSchema, MinMaxFourDigitSchema } from './schemas/index.js';
import { calculateTotalAgreedDeposit, calculatePerHeadBill, calculateTotalCharges, getPaymentStatus } from './utils/calculations.js';
import { validateAuth } from './utils/validation.js';
import * as v from 'valibot';
export type MemberDetailsFormData = {
    id?: string;
    name: string;
    phone: number;
    floor: Floor;
    bedType: BedType;
    rentAmount: number;
    rentAtJoining?: number;
    securityDeposit: number;
    advanceDeposit: number;
    isOptedForWifi: boolean;
    moveInDate: string;
    note: string;
    amountPaid: number;
    shouldForwardOutstanding: boolean;
    outstandingAmount: number;
    memberAction: MemberAction;
};

const MemberDataSchema = v.object({
    id: v.optional(v.string()),
    name: v.pipe(
        v.string(),
        v.trim(),
        v.regex(
            /^[a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,}){1,2}$/,
            'Name must be at least 2 letters long and contain at most 3 words'
        )
    ),
    phone: v.pipe(
        v.string(),
        v.trim(),
        v.transform((input) => input.replaceAll(/\s+/g, '')),
        v.regex(/^\d{10}$/, 'Phone number must be a valid 10-digit number')
    ),
    floor: v.enum(Floors, 'Floor must be either ' + Object.values(Floors).join(', ')),
    bedType: v.enum(BedTypes, 'Bed type must be either ' + Object.values(BedTypes).join(', ')),
    rentAmount: FourDigitSchema,
    rentAtJoining: v.optional(IntegerSchema),
    securityDeposit: FourDigitSchema,
    advanceDeposit: FourDigitSchema,
    isOptedForWifi: v.boolean(),
    moveInDate: v.pipe(v.string(), v.regex(/\d{4}-\d{2}-\d{2}/, 'Move-in date must be in YYYY-MM-DD format')),
    note: v.pipe(v.string(), v.trim(), v.minWords('en', 2, 'Note must be at least 2 words long')),
    amountPaid: MinMaxFourDigitSchema,
    shouldForwardOutstanding: v.boolean(),
    outstandingAmount: IntegerSchema,
    memberAction: v.enum(MemberAction, 'Member action must be either ' + Object.values(MemberAction).join(', '))
});

const parseMemberDataSchema = (data: unknown) => v.safeParse(MemberDataSchema, data);

type MemberData = v.InferOutput<typeof MemberDataSchema>;

const toMember = (memberData: MemberData, id: string): Member => {
    const totalAgreedDeposit = calculateTotalAgreedDeposit(
        memberData.rentAmount,
        memberData.securityDeposit,
        memberData.advanceDeposit
    );

    return {
        generatedAt: Timestamp.now(),
        id,
        moveInDate: Timestamp.fromDate(new Date(memberData.moveInDate)),
        name: memberData.name,
        phone: `+91${memberData.phone}`,
        floor: memberData.floor,
        bedType: memberData.bedType,
        currentRent: memberData.rentAmount,
        rentAtJoining: memberData.rentAmount,
        securityDeposit: memberData.securityDeposit,
        advanceDeposit: memberData.advanceDeposit,
        totalAgreedDeposit,
        currentMonthRent: {
            id: dayjs(memberData.moveInDate).format('YYYY-MM'), // YYYY-MM
            generatedAt: Timestamp.fromDate(new Date(memberData.moveInDate)),
            rent: memberData.rentAmount,
            electricity: 0,
            wifi: 0,
            previousOutstanding: 0,
            expenses: [],
            totalCharges: totalAgreedDeposit,
            amountPaid: memberData.amountPaid,
            currentOutstanding: memberData.shouldForwardOutstanding ? memberData.outstandingAmount : 0,
            status: memberData.shouldForwardOutstanding ? 'Partial' : 'Paid',
            note:
                memberData.shouldForwardOutstanding ?
                    `Paid ${memberData.amountPaid} out of ${totalAgreedDeposit} yet.`
                :   undefined
        },
        optedForWifi: memberData.isOptedForWifi,
        note: memberData.note,
        isActive: true
    };
};

export const addMember = onCall({ cors: true }, async (request) => {
    // 1. Validation & Schema Parsing
    validateAuth(request);
    const result = parseMemberDataSchema(request.data);

    if (!result.success) {
        throw new HttpsError('invalid-argument', 'Invalid member data', v.flatten(result.issues));
    }

    const parsedData = result.output;
    const memberRef = db.collection(MEMBERS_COL).doc();
    const defaultValuesDoc = db.collection(DEFAULT_COL).doc(VALUES_DOC);

    try {
        const transactionResult = await db.runTransaction(async (transaction) => {
            // 1. Read all the documents first
            const defaultSnap = await transaction.get(defaultValuesDoc);
            if (!defaultSnap.exists) {
                throw new Error('Default values not found');
            }

            const defaultData = defaultSnap.data() as DefaultValues;
            const currentBillingMonth = dayjs(defaultData.currentBillingMonth.toDate());
            const moveInDate = dayjs(parsedData.moveInDate);
            const prevMonth = currentBillingMonth.subtract(1, 'month');

            // Pre-calculate IDs for conditional reads
            const previousRentHistoryId = moveInDate.subtract(1, 'month').format('YYYY-MM');
            const electricBillRef = db.collection(ELECTRIC_BILLS_COL).doc(previousRentHistoryId);
            const membresRef = db.collection(MEMBERS_COL).where('isActive', '==', true);

            let electricBillSnap = null;
            let membresSnap = null;
			// Check if the member is moving in the previous month, then only we need to fetch the electric bill
            // And update the members rent for that floor
            if (moveInDate.isSame(prevMonth, 'month')) {
                electricBillSnap = await transaction.get(electricBillRef);
                membresSnap = await transaction.get(membresRef);
            }

            const member = toMember(parsedData, memberRef.id);
            const currentRentHistoryId = moveInDate.format('YYYY-MM');

           
            if (moveInDate.isSame(currentBillingMonth, 'month')) {
                // Check if the member is moving in the current month
                // Then just add the member
                transaction.set(memberRef, member);
            } else if (moveInDate.isSame(prevMonth, 'month')) {
                // Check if the member is moving in the previous month
                // Then calculate the new bill
                if (electricBillSnap && electricBillSnap.exists) {
					// Check if any bill is already generated for the previous month
					const electricBillData = electricBillSnap.data() as ElectricBill;
					const floorData = electricBillData.floorCosts[parsedData.floor];

                    let membersInFloor: Member[] = []

                    if (membresSnap) {
                        const membersData = membresSnap.docs.map((doc) => doc.data() as Member);
                        membersInFloor = membersData.filter((member) => member.floor === parsedData.floor);
                    }

                    // Logic for new bills
                    const newBill = calculatePerHeadBill(floorData.bill, floorData.members.length + 1);
                    const newWifi =
                        member.optedForWifi ?
                            calculatePerHeadBill(electricBillData.wifi.amount, electricBillData.wifi.members.length + 1)
                        :   0;

                    const memberCurrentMonthRent = {
                        id: currentRentHistoryId,
                        generatedAt: Timestamp.now(),
                        rent: member.currentRent,
                        electricity: newBill,
                        wifi: newWifi,
                        previousOutstanding: member.currentMonthRent.currentOutstanding,
                        expenses: [],
                        totalCharges: calculateTotalCharges(
                            member.currentRent,
                            newBill,
                            newWifi,
                            [],
                            member.currentMonthRent.currentOutstanding
                        ),
                        amountPaid: 0,
                        currentOutstanding: calculateTotalCharges(
                            member.currentRent,
                            newBill,
                            newWifi,
                            [],
                            member.currentMonthRent.currentOutstanding
                        ),
                        status: 'Due',
                        note: 'New member has been added in the previous month'
                    } satisfies RentHistory;

                    // Update all the members rent for that floor
                    membersInFloor.forEach((member) => {
                        const currentRent = member.currentMonthRent
                        const totalCharges = calculateTotalCharges(
                            member.currentRent,
                            newBill,
                            member.optedForWifi ? newWifi : 0,
                            currentRent.expenses,
                            currentRent.previousOutstanding
                        );
                        const currentOutstanding = totalCharges - currentRent.amountPaid;

                        const updatedRent = {
                            ...currentRent,
                            generatedAt: Timestamp.now(),
                            electricity: newBill,
                            wifi: newWifi,
                            totalCharges: totalCharges,
                            currentOutstanding: currentOutstanding,
                            status: getPaymentStatus(currentRent.amountPaid, totalCharges)
                        } satisfies RentHistory;

                        transaction.update(memberRef, {
                            currentMonthRent: updatedRent
                        });
                    });

                    // Update Member with current month rent
                    transaction.set(memberRef, {
                        ...member,
                        currentMonthRent: memberCurrentMonthRent
                    });

                    // Archive previous history in subcollection
                    const prevRentHistory = member.currentMonthRent;
                    transaction.set(memberRef.collection(RENT_HISTORY_COL).doc(previousRentHistoryId), prevRentHistory);

                    // ATOMIC UPDATE: Prevent race conditions in arrays
                    transaction.update(electricBillRef, {
                        [`floorCosts.${parsedData.floor}.members`]: FieldValue.arrayUnion(memberRef.id),
                        ...(member.optedForWifi ? { 'wifi.members': FieldValue.arrayUnion(memberRef.id) } : {})
                    });
                } else {
                    transaction.set(memberRef, member);
                }
            } else {
                // Throwing ensures the transaction rolls back
                throw new Error('Move-in date must be within the current or previous billing month');
            }

            return { success: true };
        });

        return transactionResult;
    } catch (error) {
        logger.error('Error adding member', error);
        return {
            success: false,
            errors: { root: [(error as Error).message] }
        };
    }
});

export const editMember = onCall({ cors: true }, async (request): Promise<SaveResponse> => {
    validateAuth(request);

    logger.info('Request data', request.data);

    const result = parseMemberDataSchema(request.data);

    if (!result.success) {
        return {
            success: false,
            errors: v.flatten(result.issues)
        };
    }

    const newMemberId = request.data.id;
    if (!newMemberId) {
        return {
            success: false,
            errors: {
                root: ['Member ID is required']
            }
        };
    }

    const parsedData = result.output;

    const batch = db.batch();
    const memberDoc = db.collection(MEMBERS_COL).doc(newMemberId);
    const defaults = db.collection(DEFAULT_COL).doc(VALUES_DOC);

    const memberDocSnap = await memberDoc.get();
    const defaultDocSnap = await defaults.get();
    if (!memberDocSnap.exists || !defaultDocSnap.exists) {
        return {
            success: false,
            errors: {
                root: [!memberDocSnap.exists ? 'Member not found' : 'Default values not found']
            }
        };
    }

    const memberData = memberDocSnap.data() as Member;
    const defaultValuesData = defaultDocSnap.data() as DefaultValues;
    const currentBillingMonth = defaultValuesData.currentBillingMonth.toDate();

    const memberCurrentMonthRent = memberData.currentMonthRent;
    const upadatedMember = toMember(parsedData, newMemberId);

    // Only allow edit if move-in date is only one month before current billing month
    if (dayjs(parsedData.moveInDate).isBefore(dayjs(currentBillingMonth).add(1, 'month'))) {
        logger.info('Member move-in date is before the current billing month');
        batch.update(memberDoc, { ...upadatedMember });

        // Getting the electric bill for the current billing month
        const electricDocRef = db.collection(ELECTRIC_BILLS_COL).doc(dayjs(parsedData.moveInDate).format('YYYY-MM'));
        const electricDoc = await electricDocRef.get();

        // If the electric bill doesn't exist, it means, no new bill has been created
        if (!electricDoc.exists) {
            await batch.commit();
            return {
                success: true
            };
        }

        const electricData = electricDoc.data() as ElectricBill;
        const updatedMemberFloor = upadatedMember.floor;
        const floorElectricCost = electricData.floorCosts as {
            '2nd': {
                bill: number;
                members: string[];
            };
            '3rd': {
                bill: number;
                members: string[];
            };
        };
        const wifiCost = electricData.wifi as {
            amount: number;
            members: string[];
        };

        floorElectricCost[updatedMemberFloor].members.push(newMemberId);
        if (upadatedMember.optedForWifi) {
            wifiCost.members.push(newMemberId);
        }

        // Recalcute the floor electric costs
        const newSecondFloorCost = calculatePerHeadBill(
            floorElectricCost['2nd'].bill,
            floorElectricCost['2nd'].members.length
        );
        const newThirdFloorCost = calculatePerHeadBill(
            floorElectricCost['3rd'].bill,
            floorElectricCost['3rd'].members.length
        );
        const newWifiCost = calculatePerHeadBill(wifiCost.amount, wifiCost.members.length);

        // Get all the members that are active
        const membersCol = db.collection(MEMBERS_COL).where('isActive', '==', true);
        const membersSnapshot = await membersCol.get();

        // Update members db
        membersSnapshot.forEach(async (member) => {
            const memberData = member.data() as Member;
            const wifi = memberData.optedForWifi ? newWifiCost : 0;
            const electricity = memberData.floor === '2nd' ? newSecondFloorCost : newThirdFloorCost;
            const totalCharges = calculateTotalCharges(
                memberData.currentMonthRent.rent,
                electricity,
                wifi,
                memberData.currentMonthRent.expenses,
                member.id === newMemberId ?
                    memberData.currentMonthRent.currentOutstanding
                :   memberData.currentMonthRent.previousOutstanding
            );
            const amountPaid = memberData.id === newMemberId ? 0 : memberData.currentMonthRent.amountPaid;
            const currentOutstanding = totalCharges - amountPaid;
            const status = getPaymentStatus(amountPaid, totalCharges);

            // Update the current month rent
            batch.update(member.ref, {
                currentMonthRent: {
                    ...memberData.currentMonthRent,
                    previousOutstanding:
                        memberData.id === newMemberId ?
                            memberData.currentMonthRent.currentOutstanding
                        :   memberData.currentMonthRent.previousOutstanding,
                    generatedAt: Timestamp.now(),
                    electricity,
                    wifi,
                    totalCharges,
                    currentOutstanding,
                    status
                } satisfies RentHistory
            });
        });

        const rentHistoryDocId = dayjs(currentBillingMonth).subtract(1, 'month').format('YYYY-MM');
        // Create the rentHistory for the new member
        batch.set(memberDoc.collection(RENT_HISTORY_COL).doc(rentHistoryDocId), {
            ...memberCurrentMonthRent,
            generatedAt: Timestamp.now()
        } satisfies RentHistory);

        // Update the electric bill db
        batch.update(electricDocRef, {
            floorCosts: floorElectricCost,
            wifi: wifiCost
        });

        await batch.commit();

        return {
            success: true
        };
    } else if (dayjs(parsedData.moveInDate).day(1).isSame(dayjs(currentBillingMonth).day(1))) {
        logger.info('Member move-in date is same as the current billing month');
        // If the member's joining date is not changed
        batch.update(memberDoc, { ...toMember(parsedData, newMemberId) });
        // Get Rent History and delete it
        const rentHistoryDocId = dayjs(currentBillingMonth).subtract(1, 'month').format('YYYY-MM');
        const rentHistoryDoc = await memberDoc.collection(RENT_HISTORY_COL).doc(rentHistoryDocId).get();
        // If the rent history doesn't exist, it means, no modification to the DB had been done
        // Return early
        if (!rentHistoryDoc.exists) {
            await batch.commit();
            return {
                success: true
            };
        }
        // OR, Delete the rent history
        batch.delete(rentHistoryDoc.ref);

        // Roll back the changes done to the DB
        const electricDocRef = db.collection(ELECTRIC_BILLS_COL).doc(dayjs(parsedData.moveInDate).format('YYYY-MM'));
        const electricDoc = await electricDocRef.get();
        if (!electricDoc.exists) {
            await batch.commit();
            return {
                success: true
            };
        }
        const electricData = electricDoc.data() as ElectricBill;
        const updatedMemberFloor = upadatedMember.floor;
        const floorElectricCost = electricData.floorCosts as {
            '2nd': {
                bill: number;
                members: string[];
            };
            '3rd': {
                bill: number;
                members: string[];
            };
        };
        const wifiCost = electricData.wifi as {
            amount: number;
            members: string[];
        };

        // Remove the memeber's Id from floorElectricCost and wifiCost
        floorElectricCost[updatedMemberFloor].members.splice(
            floorElectricCost[updatedMemberFloor].members.indexOf(newMemberId),
            1
        );
        if (upadatedMember.optedForWifi) {
            wifiCost.members.splice(wifiCost.members.indexOf(newMemberId), 1);
        }

        // Recalcute the floor electric costs
        const newSecondFloorCost = calculatePerHeadBill(
            floorElectricCost['2nd'].bill,
            floorElectricCost['2nd'].members.length
        );
        const newThirdFloorCost = calculatePerHeadBill(
            floorElectricCost['3rd'].bill,
            floorElectricCost['3rd'].members.length
        );
        const newWifiCost = calculatePerHeadBill(wifiCost.amount, wifiCost.members.length);

        // Get all the members that are active
        const membersCol = db.collection(MEMBERS_COL).where('isActive', '==', true);
        const membersSnapshot = await membersCol.get();

        // Update members db
        membersSnapshot.docs.forEach(async (member) => {
            const memberData = member.data() as Member;
            if (member.id === newMemberId) {
                return;
            }
            const wifi = memberData.optedForWifi ? newWifiCost : 0;
            const electricity = memberData.floor === '2nd' ? newSecondFloorCost : newThirdFloorCost;
            const totalCharges = calculateTotalCharges(
                memberData.currentMonthRent.rent,
                electricity,
                wifi,
                memberData.currentMonthRent.expenses,
                member.id === newMemberId ?
                    memberData.currentMonthRent.currentOutstanding
                :   memberData.currentMonthRent.previousOutstanding
            );
            const amountPaid = memberData.id === newMemberId ? 0 : memberData.currentMonthRent.amountPaid;
            const currentOutstanding = totalCharges - amountPaid;
            const status = getPaymentStatus(amountPaid, totalCharges);

            // Update the current month rent
            batch.update(member.ref, {
                currentMonthRent: {
                    ...memberData.currentMonthRent,
                    previousOutstanding:
                        memberData.id === newMemberId ?
                            memberData.currentMonthRent.currentOutstanding
                        :   memberData.currentMonthRent.previousOutstanding,
                    generatedAt: Timestamp.now(),
                    electricity,
                    wifi,
                    totalCharges,
                    currentOutstanding,
                    status
                } satisfies RentHistory
            });
        });

        await batch.commit();

        return {
            success: true
        };
    } else {
        return {
            success: false,
            errors: {
                root: ['Member move-in date is after the current billing month']
            }
        };
    }
});
