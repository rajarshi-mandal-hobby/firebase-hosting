import { doc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from './src/firebase';
import type { Member, RentHistory, Bill, BedRents, PaymentStatus, DefaultRents, Floor } from './src/data/types';
import { BED, FLOOR } from './src/data/types';
import { BaseRentsAndRollingBills } from './src/data/types/DefaultRents';

const RENTS: BedRents = {
    second: { single: 1600, double: 3200, special: 2000 },
    third: { single: 1600, double: 3200 }
};

const DEFAULT_WIFI_CHARGE = 600 as const;

interface MemberWithHistory extends Member {
    rentHistory: RentHistory[];
}

function prepareData() {
    const names = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'David Williams', 'Eve Davis', 'Fiona Green'];
    const expenseTexts = ['Fine for late payment', 'Fine for not cleaning room', 'Fine for breaking rules'];
    const expenseAmounts = [100, 200, 300];
    const costCache: Record<
        string,
        { second: number; third: number; wifi: number; secondBill: number; thirdBill: number }
    > = {};

    // 1. Helpers
    const getMonthlyCosts = (date: Date, stats: { second: number; third: number; wifi: number }) => {
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const secondBill = Math.ceil(Math.random() * 4) * 100 + 300;
        const thirdBill = Math.ceil(Math.random() * 4) * 100 + 300;
        const wifiBill = DEFAULT_WIFI_CHARGE;

        if (!costCache[key]) {
            costCache[key] = {
                second: stats.second > 0 ? secondBill / stats.second : 0,
                third: stats.third > 0 ? thirdBill / stats.third : 0,
                wifi: stats.wifi > 0 ? wifiBill / stats.wifi : 0,
                secondBill,
                thirdBill
            };
        }
        return costCache[key];
    };

    const getRentConfig = (i: number) => {
        if (i === 2)
            return {
                rent: RENTS.second.special,
                floor: FLOOR.second,
                bed: BED.special,
                wifi: true
            };
        const floor = i % 2 === 0 ? FLOOR.second : FLOOR.third;
        const bed = i % 3 === 0 ? BED.double : BED.single;
        const wifi = i % 2 === 0;

        return {
            rent: RENTS[floor][bed],
            floor,
            bed,
            wifi
        };
    };

    const toMonthKey = (date: Date) => date.toISOString().slice(0, 7);

    const getRandom = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    // today should be 2nd of the month
    // ALL OTHER DATES SHOULD BE 1ST OF THE MONTH
    const TODAY = new Date();
    TODAY.setDate(2);

    const davidWilliamsInactiveDate = new Date(TODAY);
    davidWilliamsInactiveDate.setDate(30);
    davidWilliamsInactiveDate.setMonth(davidWilliamsInactiveDate.getMonth() - 2);

    // 2. Prepopulate members data
    // First date of rent history
    let firstRentHistoryDate = new Date(TODAY);

    // Create members data without currentMonthRent
    const membersData = names.map((name, i) => {
        const moveInDate = new Date();
        moveInDate.setDate(1);
        moveInDate.setMonth(moveInDate.getMonth() - i * 3);
        const rentConfig = getRentConfig(i);

        firstRentHistoryDate = moveInDate;

        const isDavid = name === 'David Williams';

        return {
            id: `member-${i + 1}`,
            name,
            phone: `+91987654321${i}`,
            moveInDate: Timestamp.fromDate(moveInDate),
            securityDeposit: 1000,
            advanceDeposit: rentConfig.rent,
            rent: rentConfig.rent,
            totalAgreedDeposit: rentConfig.rent * 2 + 1000,
            floor: rentConfig.floor,
            optedForWifi: rentConfig.wifi,
            bed: rentConfig.bed,
            remarks: '',
            isActive: !isDavid,
            ...(isDavid ? { leaveDate: Timestamp.fromDate(davidWilliamsInactiveDate) } : {})
        } satisfies Partial<Member>;
    });

    // 3. Prepopulate electric bills data
    const billingData = new Map<string, Bill>();

    const billIteratorDate = new Date(firstRentHistoryDate);
    while (billIteratorDate.getTime() <= TODAY.getTime()) {
        // Store the map of first and second floor and wifi for stats
        const nameIdMap = {
            second: {},
            third: {}
        } as Record<Floor, Record<string, string>>;
        const wifiIds = [] as string[];

        for (const member of membersData) {
            // If the member has move in date after the bill generated date then don't add to the billing data
            if (member.moveInDate.toDate() <= billIteratorDate) {
                // If the member has leave date before the bill generated date then don't add to the billing data
                if (member.leaveDate && member.leaveDate.toDate() < billIteratorDate) {
                    continue;
                }

                // Add the member to the electric billing data except the first member who joined recently
                const isNotAlice = member.name !== 'Alice Johnson';
                if (isNotAlice) {
                    nameIdMap[member.floor][member.id] = member.name;
                }
                // Add the member to the billing data if he opted for wifi
                if (member.optedForWifi) {
                    wifiIds.push(member.id);
                }
            }
        }

        // Store the member IDs for first and second floor and wifi
        const memberIds = {
            second: Object.keys(nameIdMap.second),
            third: Object.keys(nameIdMap.third),
            wifi: wifiIds
        };

        const costs = getMonthlyCosts(billIteratorDate, {
            second: memberIds.second.length,
            third: memberIds.third.length,
            wifi: memberIds.wifi.length
        });

        // Add expense for odd months
        const shouldAddExpenses = (billIteratorDate.getMonth() + 1) % 2 === 1;
        const randomExpText = shouldAddExpenses ? getRandom(expenseTexts) : '';
        const randomExpAmount = shouldAddExpenses ? getRandom(expenseAmounts) : 0;
        const randomMembers =
            shouldAddExpenses ? [getRandom(memberIds.second), getRandom(memberIds.third)].filter(Boolean) : [];
        const monthKey = toMonthKey(billIteratorDate);

        billingData.set(monthKey, {
            id: monthKey,
            generatedAt: Timestamp.fromDate(billIteratorDate),
            electric: {
                second: {
                    totalAmount: costs.secondBill,
                    members: memberIds.second
                },
                third: {
                    totalAmount: costs.thirdBill,
                    members: memberIds.third
                }
            },
            expenses: {
                members: shouldAddExpenses ? randomMembers : [],
                totalAmount: shouldAddExpenses ? randomExpAmount : 0,
                description: shouldAddExpenses ? randomExpText : ''
            },
            wifi: {
                members: memberIds.wifi,
                totalAmount: DEFAULT_WIFI_CHARGE
            },
            idNameMap: { ...nameIdMap.second, ...nameIdMap.third }
        } satisfies Bill);

        billIteratorDate.setMonth(billIteratorDate.getMonth() + 1);
    }

    // 4. Generate History
    const history = membersData.map((member) => {
        const joinDate = member.moveInDate.toDate();

        const rentHistory: RentHistory[] = [];
        const memberIteratorDate = new Date(joinDate);
        const rentAmount = member.rent;
        const optedForWifi = member.optedForWifi;

        let monthCount = 0;

        // Iterate through every month from joinDate to now
        while (memberIteratorDate <= TODAY) {
            // If the member has left then don't add to the history
            if (member.leaveDate && memberIteratorDate > member.leaveDate.toDate()) {
                break;
            }

            const bill = billingData.get(toMonthKey(memberIteratorDate));

            if (!bill) {
                throw new Error(`Bill not found for ${toMonthKey(memberIteratorDate)}`);
            }

            const calcPerHead = (bill: number, members: string[]) => {
                return Math.floor(bill / members.length);
            };

            const costs = bill.electric;
            const perHeadElectricity =
                monthCount === 0 ? 0
                : member.floor === 'second' ? calcPerHead(costs.second.totalAmount, costs.second.members)
                : calcPerHead(costs.third.totalAmount, costs.third.members);
            const perHeadWifiCharge = optedForWifi ? calcPerHead(bill.wifi.totalAmount, bill.wifi.members) : 0;
            const expense =
                monthCount === 0 ? 0
                : bill.expenses.members.includes(member.id) ?
                    calcPerHead(bill.expenses.totalAmount, bill.expenses.members)
                :   0;

            const previousMonthOutstanding = rentHistory[monthCount - 1]?.outstanding || 0;
            monthCount++;

            // Randomly mark some months as partial, paid, overpaid or due
            let status = ['Partial', 'Paid', 'Overpaid', 'Due'][Math.floor(Math.random() * 4)] as PaymentStatus;
            const totalCharges =
                rentAmount + perHeadElectricity + perHeadWifiCharge + expense + previousMonthOutstanding;
            let amountPaid = totalCharges;
            let outstanding = 0;
            // Alice Johnson should be marked as paid
            if (member.name === 'Alice Johnson') {
                status = 'Paid';
                amountPaid = totalCharges;
                outstanding = 0;
            } else if (status === 'Due') {
                amountPaid = 0;
                outstanding = totalCharges;
            } else if (status === 'Overpaid') {
                amountPaid = totalCharges + 100;
                outstanding = totalCharges - amountPaid;
            } else if (status === 'Partial') {
                amountPaid = totalCharges - 100;
                outstanding = totalCharges - amountPaid;
            }

            rentHistory.push({
                id: toMonthKey(memberIteratorDate),
                generatedAt: Timestamp.fromDate(memberIteratorDate),
                rent: rentAmount,
                electricity: perHeadElectricity || 0,
                wifi: perHeadWifiCharge || 0,
                adjustments: expense ? [{ amount: expense, description: bill.expenses.description }] : [],
                totalCharges: totalCharges,
                amountPaid: amountPaid,
                outstanding,
                note:
                    status === 'Partial' ? 'Paid 100 less'
                    : status === 'Overpaid' ? 'Paid 100 extra'
                    : '',
                status: status
            });

            memberIteratorDate.setMonth(memberIteratorDate.getMonth() + 1);
        }

        return {
            ...member,
            currentMonthRent: rentHistory[rentHistory.length - 1], // Add the last month rent to the current month rent
            rentHistory: rentHistory.slice(0, -1) // Remove the last month rent from the rentHistory
        } as MemberWithHistory;
    });

    return { membersWithHistory: history, billingData: Array.from(billingData.values()) };
}

const seedFirestoreEmulator = async () => {
    console.log('🌱 Seeding Firestore...');

    try {
        const { membersWithHistory, billingData } = prepareData();
        const batch = writeBatch(db);

        // 1. Seed Global Settings
        const defaultValuesRef = doc(db, 'config', 'default-values');
        const currentDate = billingData[billingData.length - 1].generatedAt.toDate();
        const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        batch.set(defaultValuesRef, {
            rents: {
                second: { single: RENTS.second.single, double: RENTS.second.double, special: RENTS.second.special },
                third: { single: RENTS.third.single, double: RENTS.third.double }
            },
            securityDeposit: 1000,
            wifiCharge: 500,
            billDates: {
                prevMonth: Timestamp.fromDate(prevDate),
                currentMonth: Timestamp.fromDate(currentDate)
            }
        } satisfies DefaultRents);
        console.log('⭕ Default values added...');

        // 1.1. Add Default Rents 2
        const defaultRents2Ref = doc(db, 'config', 'rents_bills');
        const currentBillData = billingData[billingData.length - 1];
        const prevBillData = billingData[billingData.length - 2];

        batch.set(defaultRents2Ref, {
            defaults: {
                rents: {
                    second: { single: RENTS.second.single, double: RENTS.second.double, special: RENTS.second.special },
                    third: { single: RENTS.third.single, double: RENTS.third.double }
                },
                securityDeposit: 1000
            },
            bills: {
                previousMonth: prevBillData,
                currentMonth: currentBillData
            }
        } satisfies BaseRentsAndRollingBills);
        console.log('⭕ Rent and bills added...');

        // 2. Seed Members
        membersWithHistory.forEach((member) => {
            const memberRef = doc(db, 'members', member.id);
            const { rentHistory, ...memberData } = member;
            batch.set(memberRef, memberData);

            // Seed rent-history subcollection
            rentHistory.forEach((history) => {
                const rentHistoryRef = doc(memberRef, 'rent-history', history.id);
                batch.set(rentHistoryRef, history);
            });
        });
        console.log('⭕ Members added...');

        // 3. Seed Bills
        billingData.forEach((bill) => {
            const billRef = doc(db, 'bills', bill.id);
            batch.set(billRef, bill);
        });
        console.log('⭕ Bills added...');

        // 4. Commit everything at once
        await batch.commit();
        console.log('✅ Successfully seeded Firestore emulator!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding Firestore emulator:', error);
        process.exit(1);
    }
};

// Seed the emulator
seedFirestoreEmulator();
