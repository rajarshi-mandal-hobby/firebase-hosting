/**
 * Seed Emulator Script
 * 
 * Run this script to populate the Firestore emulator with mock data.
 * Make sure the Firebase emulators are running before executing this script.
 */

import { seedFirestoreEmulator } from './src/data/mock/firestoreSeeder';

// Seed the emulator
console.log('🚀 Starting emulator seeding process...');

seedFirestoreEmulator()
  .then(() => {
    console.log('🎉 Emulator seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Emulator seeding failed:', error);
    process.exit(1);
  });
