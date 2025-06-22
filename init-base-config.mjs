#!/usr/bin/env node

/**
 * Script to initialize and verify base configuration in Firestore
 * This script ensures the base configuration (bedTypes, deposits, wifi charges) is properly set up
 * 
 * Usage: node init-base-config.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.development' });

// Verify environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_REGION',
  'VITE_FIREBASE_EMULATOR_HOST',
  'VITE_FIRESTORE_EMULATOR_PORT'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
  process.exit(1);
}

// Firebase configuration using environment variables
const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  // Only projectId is needed for emulator connection
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to Firestore emulator
const emulatorHost = process.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost';
const emulatorPort = process.env.VITE_FIRESTORE_EMULATOR_PORT || '8080';

// Connect to emulator
import { connectFirestoreEmulator } from 'firebase/firestore';
try {
  connectFirestoreEmulator(db, emulatorHost, parseInt(emulatorPort));
  console.log(`🔧 Connected to Firestore emulator at ${emulatorHost}:${emulatorPort}`);
} catch (error) {
  console.log('⚠️  Firestore emulator connection already established');
}

async function initializeBaseConfig() {
  try {
    console.log('🔍 Checking base configuration...');
    
    const baseConfigRef = doc(db, 'config', 'baseSettings');
    const baseConfigSnap = await getDoc(baseConfigRef);
    
    if (!baseConfigSnap.exists()) {
      console.log('📝 Base configuration not found. Creating default configuration...');
      
      const defaultBaseConfig = {
        floors: ['2nd', '3rd'],
        bedTypes: {
          "2nd": {
            "Bed": 1600,
            "Special Room": 1700,
            "Room": 3200
          },
          "3rd": {
            "Bed": 1600,
            "Room": 3200
          }
        },
        defaultSecurityDeposit: 1000,
        wifiMonthlyCharge: 500,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(baseConfigRef, defaultBaseConfig);
      console.log('✅ Base configuration created successfully!');
      
      // Display the configuration
      console.log('\n📋 Base Configuration:');
      console.log('Floors:', defaultBaseConfig.floors);
      console.log('Bed Types:');
      Object.entries(defaultBaseConfig.bedTypes).forEach(([floor, bedTypes]) => {
        console.log(`  ${floor}:`);
        Object.entries(bedTypes).forEach(([bedType, price]) => {
          console.log(`    ${bedType}: ₹${price}`);
        });
      });
      console.log('Default Security Deposit: ₹' + defaultBaseConfig.defaultSecurityDeposit);
      console.log('WiFi Monthly Charge: ₹' + defaultBaseConfig.wifiMonthlyCharge);
    } else {
      console.log('✅ Base configuration already exists');
      
      const data = baseConfigSnap.data();
      console.log('\n📋 Current Base Configuration:');
      console.log('Floors:', data.floors);
      console.log('Bed Types:');
      Object.entries(data.bedTypes).forEach(([floor, bedTypes]) => {
        console.log(`  ${floor}:`);
        Object.entries(bedTypes).forEach(([bedType, price]) => {
          console.log(`    ${bedType}: ₹${price}`);
        });
      });
      console.log('Default Security Deposit: ₹' + data.defaultSecurityDeposit);
      console.log('WiFi Monthly Charge: ₹' + data.wifiMonthlyCharge);
    }
    
    console.log('\n🎉 Base configuration verification complete!');
    
  } catch (error) {
    console.error('❌ Error initializing base configuration:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeBaseConfig();
