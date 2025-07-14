/**
 * Firestore Emulator Data Seeder
 * 
 * This script seeds the Firestore emulator with mock data for development and testing.
 * Run this script after starting the Firebase emulators to populate the database.
 */

import { db } from '../../../firebase';
import { doc, setDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { 
  mockGlobalSettings, 
  mockAdminConfig, 
  mockMembers, 
  mockRentHistory, 
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
    if (typeof objectToCheck.seconds === 'number' && typeof (objectToCheck as { toDate?: unknown }).toDate === 'function') {
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
    // Create a batch for efficient writes
    const batch = writeBatch(db);

    // 1. Seed Global Settings
    console.log('📝 Adding global settings...');
    const globalSettingsRef = doc(db, 'config', 'globalSettings');
    const cleanedGlobalSettings = convertTimestampsInObject(mockGlobalSettings);
    batch.set(globalSettingsRef, cleanedGlobalSettings);

    // 2. Seed Admin Configuration
    console.log('👤 Adding admin configuration...');
    const adminConfigRef = doc(db, 'config', 'adminConfig');
    const cleanedAdminConfig = convertTimestampsInObject(mockAdminConfig);
    batch.set(adminConfigRef, cleanedAdminConfig);

    // 3. Seed Members (excluding rentHistory as it goes in subcollection)
    console.log('👥 Adding members...');
    mockMembers.forEach((member) => {
      const memberRef = doc(db, 'members', member.id);
      // Remove rentHistory from member data since it goes in subcollection
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rentHistory, ...memberData } = member;
      const cleanedMember = convertTimestampsInObject(memberData);
      batch.set(memberRef, cleanedMember);
    });

    // 4. Commit the main batch first
    await batch.commit();
    console.log('✅ Main collections seeded successfully!');

    // 5. Seed Rent History as subcollections (requires separate operations)
    console.log('💰 Adding rent history as subcollections...');
    for (const rentRecord of mockRentHistory) {
      // Extract memberId from rent record ID (format: member-X-YYYY-MM)
      const memberId = rentRecord.id.split('-').slice(0, 2).join('-'); // "member-1", "member-2", etc.
      const monthId = rentRecord.id.split('-').slice(2).join('-'); // "2025-07", "2025-06", etc.
      
      const memberDocRef = doc(db, 'members', memberId);
      const rentHistoryRef = doc(memberDocRef, 'rentHistory', monthId);
      const cleanedRentRecord = convertTimestampsInObject(rentRecord);
      
      await setDoc(rentHistoryRef, cleanedRentRecord);
      console.log(`  ✓ Added rent history for ${memberId} - ${monthId}`);
    }

    // 6. Seed Electric Bills (separate operations after main batch)
    console.log('⚡ Adding electric bills...');
    for (const bill of mockElectricBills) {
      const billRef = doc(db, 'electricBills', bill.id);
      const cleanedBill = convertTimestampsInObject(bill);
      await setDoc(billRef, cleanedBill);
      console.log(`  ✓ Added electric bill for ${bill.id}`);
    }
    
    console.log('✅ Successfully seeded Firestore emulator with mock data!');
    console.log(`
📊 Data Summary:
- Global Settings: ✅
- Admin Config: ✅ 
- Members: ${mockMembers.length} documents
- Rent History: ${mockRentHistory.length} subcollection documents
- Electric Bills: ${mockElectricBills.length} documents

🎯 You can now view the data in the Firestore Emulator UI:
   http://127.0.0.1:4000/firestore
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
      
      // Add rent history as subcollection (for now, using the global mock data)
      // In a real scenario, you'd have member-specific rent history
      for (const rentRecord of mockRentHistory) {
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
  console.log('⚠️ To clear emulator data, restart the Firebase emulators');
};
