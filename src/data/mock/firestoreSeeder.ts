/**
 * Firestore Emulator Data Seeder
 *
 * This script seeds the Firestore emulator with mock data for development and testing.
 * Run this script after starting the Firebase emulators to populate the database.
 */

import { db } from '../../firebase';
import { doc, setDoc, writeBatch, Timestamp, serverTimestamp } from 'firebase/firestore';
import {
    mockGlobalSettings,
    mockAdminConfig,
    mockMembers,
    mockRentHistoryByMember,
    mockElectricBills
} from './mockData';

/**
 * Convert mock timestamp to Firestore Timestamp
 */
const convertMockTimestamp = (mockTimestamp: { seconds: number; nanoseconds?: number }): Timestamp => {
    if (mockTimestamp && mockTimestamp.seconds) {
        return new Timestamp(mockTimestamp.seconds, mockTimestamp.nanoseconds || 0);
    }
    return Timestamp.now();
};

/**
 * Deep convert mock timestamps in an object to Firestore timestamps
 * Also removes undefined values (Firestore doesn't accept them)
 */
const convertTimestampsInObject = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return null;

    if (Array.isArray(obj)) {
        return obj.map(convertTimestampsInObject);
    }

    if (typeof obj === 'object') {
        const objectToCheck = obj as Record<string, unknown>;

        // Check if this looks like a mock timestamp
        if (
            typeof objectToCheck.seconds === 'number' &&
            typeof (objectToCheck as { toDate?: unknown }).toDate === 'function'
        ) {
            return convertMockTimestamp(objectToCheck as { seconds: number; nanoseconds?: number });
        }

        // Recursively convert nested objects and remove undefined values
        const converted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(objectToCheck)) {
            if (value !== undefined) {
                converted[key] = convertTimestampsInObject(value);
            }
        }
        return converted;
    }

    return obj;
};

/**
 * Seed the Firestore emulator with mock data
 */
export const seedFirestoreEmulator = async () => {
    console.log('🌱 Seeding Firestore emulator with mock data...');

    try {
        const batch = writeBatch(db);
        let totalRentHistoryRecords = 0;

        // 1. Seed Global Settings
        const defaultValuesRef = doc(db, 'defaults', 'values');
        batch.set(defaultValuesRef, convertTimestampsInObject(mockGlobalSettings));

        // 2. Seed Members
        mockMembers.forEach((member) => {
            const memberRef = doc(db, 'members', member.id);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { rentHistory, ...memberData } = member;
            batch.set(memberRef, convertTimestampsInObject(memberData));
        });

        // 3. Seed Rent History (Subcollections)
        Object.entries(mockRentHistoryByMember).forEach(([memberId, rentHistoryRecords]) => {
            const memberDocRef = doc(db, 'members', memberId);
            rentHistoryRecords.forEach((rentRecord) => {
                const rentHistoryRef = doc(memberDocRef, 'rent-history', rentRecord.id);
                batch.set(rentHistoryRef, convertTimestampsInObject(rentRecord));
                totalRentHistoryRecords++;
            });
        });

        // 4. Seed Electric Bills
        mockElectricBills.forEach((bill) => {
            const billRef = doc(db, 'electric-bills', bill.id);
            batch.set(billRef, convertTimestampsInObject(bill));
        });

        // 5. Commit everything at once
        await batch.commit();

        console.log('✅ Successfully seeded Firestore emulator!');
        console.log(`
📊 Data Summary:
- Global Settings: ✅
- Members: ${mockMembers.length} documents
- Rent History: ${totalRentHistoryRecords} documents
- Electric Bills: ${mockElectricBills.length} documents
        `);
    } catch (error) {
        console.error('❌ Error seeding Firestore emulator:', error);
        throw error;
    }
};


/**
 * Alternative: Seed with subcollection structure (more realistic)
 */
export const seedWithSubcollections = async () => {
    console.log('🌱 Seeding Firestore with subcollection structure...');

    try {
        // 1. Global Settings
        await setDoc(doc(db, 'settings', 'global'), mockGlobalSettings);

        // 2. Admin Config
        await setDoc(doc(db, 'admin', 'config'), mockAdminConfig);

        // 3. Members with rent history as subcollections
        for (const member of mockMembers) {
            // Add member document
            await setDoc(doc(db, 'members', member.id), member);

            // Add rent history as subcollection using member-specific data
            const memberRentHistory = mockRentHistoryByMember[member.id] || [];
            for (const rentRecord of memberRentHistory) {
                const rentRef = doc(db, 'members', member.id, 'rentHistory', rentRecord.id);
                await setDoc(rentRef, rentRecord);
            }
        }

        // 4. Electric Bills
        for (const bill of mockElectricBills) {
            await setDoc(doc(db, 'electricBills', bill.id), bill);
        }

        console.log('✅ Successfully seeded with subcollection structure!');
    } catch (error) {
        console.error('❌ Error seeding with subcollections:', error);
        throw error;
    }
};

/**
 * Clear all data from the emulator (useful for testing)
 */
export const clearEmulatorData = async () => {
    console.log('🗑️ Clearing emulator data...');

    // Note: In a real scenario, you'd need to implement recursive deletion
    // For now, this is a placeholder - emulator data is cleared when restarted
};

export const seedTestData = async () => {
    const batch = writeBatch(db);
    const memberId = 'member-2';

    // Starting from March 2026
    let year = 2026;
    let month = 3;

    for (let i = 0; i < 24; i++) {
        // Format ID as YYYY-MM
        const monthStr = month.toString().padStart(2, '0');
        const docId = `${year}-${monthStr}`;

        const docRef = doc(db, 'members', memberId, 'rent-history', docId);

        const rent = 1600;
        const electricity = Math.floor(Math.random() * 1000);
        const wifi = Math.floor(Math.random() * 100);
        const previousOutstanding = 0;
        const expenses =
            Math.random() > 0.5 ?
                [
                    { amount: 100, description: 'Common area cleaning' },
                    { amount: 50, description: 'Maintenance' }
                ]
            :   [];
        const totalCharges =
            rent + electricity + wifi + expenses.reduce((sum, exp) => sum + exp.amount, 0) + previousOutstanding;
        const status = Math.random() > 0.5 ? 'Paid' : 'Partial';
        const amountPaid = status === 'Paid' ? totalCharges : Math.floor(Math.random() * totalCharges);
        const currentOutstanding = totalCharges - amountPaid;

        batch.set(docRef, {
            rent: rent,
            electricity: electricity,
            wifi: wifi,
            previousOutstanding: previousOutstanding,
            expenses: expenses,
            totalCharges: totalCharges,
            amountPaid: amountPaid,
            currentOutstanding: currentOutstanding,
            status: status,
            generatedAt: serverTimestamp() // Current server time
        });

        // Move to previous month
        month--;
        if (month === 0) {
            month = 12;
            year--;
        }
    }

    await batch.commit();
    console.log("Mock data for 'member-2/test-history' created successfully!");
};
