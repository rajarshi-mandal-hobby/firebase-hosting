/**
 * Test Delete Calculation
 * Simple test to verify settlement calculation works correctly
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, getDocs } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env.development
const envPath = resolve('.env.development');
const envFile = readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const firebaseConfig = {
  projectId: envVars.VITE_FIREBASE_PROJECT_ID || "rajarshi-mess",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app, envVars.VITE_FIREBASE_REGION || 'us-central1');

// Connect to emulators
try {
  const firestoreHost = envVars.VITE_EMULATOR_FIRESTORE_HOST || 'localhost';
  const firestorePort = parseInt(envVars.VITE_EMULATOR_FIRESTORE_PORT || '8080');
  const functionsHost = envVars.VITE_EMULATOR_FUNCTIONS_HOST || 'localhost';
  const functionsPort = parseInt(envVars.VITE_EMULATOR_FUNCTIONS_PORT || '5001');
  
  connectFirestoreEmulator(db, firestoreHost, firestorePort);
  connectFunctionsEmulator(functions, functionsHost, functionsPort);
} catch (error) {
  console.log('Emulators already connected');
}

async function testDeleteCalculation() {
  try {
    console.log('🧪 Testing Delete Calculation with Mock Data\n');
    
    // Get all active students
    const studentsRef = collection(db, 'students');
    const snapshot = await getDocs(studentsRef);
    
    if (snapshot.empty) {
      console.log('❌ No students found. Run create-mock-data.mjs first.');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} students in database\n`);
    
    // Test calculation function with a few students
    const calculatePreview = httpsCallable(functions, 'calculateSettlementPreview');
    let testCount = 0;
    
    for (const doc of snapshot.docs.slice(0, 3)) { // Test first 3 students
      const student = doc.data();
      
      if (!student.isActive) continue; // Skip inactive students
      
      testCount++;
      console.log(`🧮 Test ${testCount}: ${student.name}`);
      console.log(`   Floor: ${student.floor}, Bed: ${student.bedType}`);
      console.log(`   Deposit: ₹${student.totalDepositAgreed}`);
      console.log(`   Outstanding: ₹${student.currentOutstandingBalance}`);
      
      // Calculate expected result
      const expectedRefund = student.totalDepositAgreed - student.currentOutstandingBalance;
      console.log(`   Expected Settlement: ₹${expectedRefund} ${
        expectedRefund > 0 ? '(Refund Due)' : 
        expectedRefund < 0 ? '(Payment Due)' : '(Settled)'
      }`);
      
      try {
        // Test cloud function
        const result = await calculatePreview({
          studentId: doc.id,
          leaveDate: new Date().toISOString()
        });
        
        console.log(`   ✅ Function Result: ₹${result.data.refundAmount} (${result.data.status})`);
        
        // Verify calculation
        if (result.data.refundAmount === expectedRefund) {
          console.log(`   ✅ Calculation CORRECT\n`);
        } else {
          console.log(`   ❌ Calculation MISMATCH! Expected: ${expectedRefund}, Got: ${result.data.refundAmount}\n`);
        }
        
      } catch (error) {
        console.log(`   ❌ Function Error: ${error.message}\n`);
      }
    }
    
    console.log('🎉 Delete calculation testing complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDeleteCalculation();
