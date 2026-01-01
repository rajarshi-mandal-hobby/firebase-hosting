// import { HttpsError, onCall } from "firebase-functions/https";
// import { validateAuth } from "./utils/validation.js";
// import { logger } from "firebase-functions";
// import { validateBillsInput } from "./schemas/bills.js";
// import * as v from "valibot";
// import {
//    DEFAULT_COL,
//    DefaultValues,
//    ELECTRIC_BILLS_COL,
//    ElectricBill,
//    MEMBERS_COL,
//    MemberWithCurrentMonthRent,
//    RENT_HISTORY_COL,
//    RentHistory,
//    SaveResponse,
//    VALUES_DOC
// } from "./types/index.js";
// import { db } from "./index.js";
// import { Timestamp } from "firebase-admin/firestore";
// import dayjs from "dayjs";

// export const saveBill = onCall({ cors: true }, async (req): Promise<SaveResponse> => {
//    validateAuth(req);

//    const vData = validateBillsInput(req.data);

//    if (!vData.success) {
//       return {
//          success: false,
//          errors: v.flatten(vData.issues)
//       };
//    }

//    const {
//       selectedBillingMonth,
//       wifiCharges,
//       secondFloorElectricityBill,
//       thirdFloorElectricityBill,
//       additionalExpenses,
//       isUpdatingBills,
//       submittedMembers
//    } = vData.output;

//    const defaultValuesDocRef = db.collection(DEFAULT_COL).doc(VALUES_DOC);
//    const defaultValuesDocSnap = await defaultValuesDocRef.get();

//    if (!defaultValuesDocSnap.exists) {
//       throw new HttpsError("not-found", "Default values not found");
//    }

//    const defaultValues = defaultValuesDocSnap.data() as DefaultValues;

//    const isNewBills = !isUpdatingBills;
//    const defaulDate = isNewBills ? defaultValues.nextBillingMonth : defaultValues.currentBillingMonth;
//    const selectedDate = Timestamp.fromDate(selectedBillingMonth);

//    if (!dayjs(defaulDate.toDate()).isSame(dayjs(selectedDate.toDate()), "month")) {
//       throw new HttpsError("invalid-argument", "Selected billing month is not valid");
//    }

//    let currentBillingMonth = defaultValues.currentBillingMonth;
//    let nextBillingMonth = defaultValues.nextBillingMonth;

//    if (isNewBills) {
//       currentBillingMonth = selectedDate;
//       nextBillingMonth = Timestamp.fromDate(dayjs(selectedDate.toDate()).add(1, "month").toDate());
//    }

//    try {
//       return await db.runTransaction(async (transaction) => {
//          const membersRef = db.collection(MEMBERS_COL);
//          const membersSnap = await transaction.get(membersRef.where("isActive", "==", true));

//          if (membersSnap.empty) {
//             throw new HttpsError("not-found", "Members not found");
//          }

//          const secondFloorMembers: { id: string; name: string }[] = [];
//          const thirdFloorMembers: { id: string; name: string }[] = [];

//          membersSnap.docs.forEach((doc) => {
//             const member = doc.data() as MemberWithCurrentMonthRent;
//             const memberFloor = member.floor;
//             const memberBedType = member.bedType;
//             const memberRent = defaultValues.bedRents[memberFloor][memberBedType];

//             // Initialize currentMonthRent if it doesn't exist
//             if (!member.currentMonthRent) {
//                member.currentMonthRent = {} as RentHistory;
//             }
//             const currentMonthRent = member.currentMonthRent;

//             transaction.set(
//                doc.ref.collection(RENT_HISTORY_COL).doc(dayjs(selectedBillingMonth).format("YYYY-MM")),
//                { ...currentMonthRent },
//                { merge: true }
//             );

//             if (memberFloor === "2nd") {
//                secondFloorMembers.push({ id: member.id, name: member.name });
//             } else {
//                thirdFloorMembers.push({ id: member.id, name: member.name });
//             }
//             currentMonthRent.id = dayjs(selectedBillingMonth).format("YYYY-MM");
//             currentMonthRent.generatedAt = Timestamp.now();
//             currentMonthRent.rent = memberRent;
//             currentMonthRent.electricity =
//                memberFloor === "2nd" ? secondFloorElectricityBill : thirdFloorElectricityBill;
//             currentMonthRent.wifi = wifiCharges.wifiMonthlyCharge;
//             currentMonthRent.expenses = additionalExpenses.addExpenseMemberIds.has(member.id)
//                ? [
//                     {
//                        amount: additionalExpenses.addExpenseAmount,
//                        description: additionalExpenses.addExpenseDescription
//                     }
//                  ]
//                : [];

//             currentMonthRent.totalCharges =
//                memberRent +
//                currentMonthRent.electricity +
//                currentMonthRent.wifi +
//                currentMonthRent.expenses.reduce((acc, expense) => acc + expense.amount, 0);
//             currentMonthRent.amountPaid = 0;
//             currentMonthRent.currentOutstanding = currentMonthRent.totalCharges;
//             currentMonthRent.status = "Due";

//             transaction.set(doc.ref, member, { merge: true });
//          });

//          const electricId = dayjs(selectedBillingMonth).format("YYYY-MM");
//          const expensesMembers =
//             additionalExpenses.addExpenseAmount > 0
//                ? submittedMembers.memberOptions.map((member) => ({
//                     id: member.value,
//                     name: member.label
//                  }))
//                : [];
//          const newElectricityBills: ElectricBill = {
//             id: electricId,
//             floorCosts: {
//                "2nd": {
//                   bill: secondFloorElectricityBill,
//                   members: secondFloorMembers
//                },
//                "3rd": {
//                   bill: thirdFloorElectricityBill,
//                   members: thirdFloorMembers
//                }
//             },
//             appliedBulkExpenses: {
//                members: expensesMembers,
//                amount: additionalExpenses.addExpenseAmount,
//                description: additionalExpenses.addExpenseDescription
//             },
//             generatedAt: selectedDate,
//             lastUpdated: Timestamp.now()
//          };

//          transaction.set(db.collection(ELECTRIC_BILLS_COL).doc(electricId), newElectricityBills, { merge: true });
//          if (isNewBills) {
//             transaction.update(defaultValuesDocRef, {
//                currentBillingMonth: currentBillingMonth,
//                nextBillingMonth: nextBillingMonth
//             });
//          }

//          return {
//             success: true
//          };
//       });
//    } catch (error) {
//       logger.error(error);
//       throw error;
//    }
// });
