/**
 * Mock Test Data Generator
 * Creates realistic test data based on Firestore.txt specification
 * 
 * This file generates:
 * - Global configuration
 * - Sample students with proper financial data
 * - Rent history records
 * - Proper settlement scenarios for testing
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
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

// Firebase config for emulator
const firebaseConfig = {
  projectId: envVars.VITE_FIREBASE_PROJECT_ID || "rajarshi-mess",
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN || "rajarshi-mess.firebaseapp.com",
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET || "rajarshi-mess.appspot.com",
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: envVars.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to Firestore emulator
try {
  const firestoreHost = envVars.VITE_EMULATOR_FIRESTORE_HOST || 'localhost';
  const firestorePort = parseInt(envVars.VITE_EMULATOR_FIRESTORE_PORT || '8080');
  connectFirestoreEmulator(db, firestoreHost, firestorePort);
} catch (error) {
  console.log('Firestore emulator already connected');
}

/**
 * Global Configuration Data (from Firestore.txt)
 */
const globalConfig = {
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
  currentBillingCycleStart: "2025-06",
  nextBillingCycleStart: "2025-07",
  wifiMonthlyCharge: 500,
  activeStudentCounts: {
    total: 8,
    byFloor: {
      "2nd": 5,
      "3rd": 3
    },
    wifiOpted: 6
  },
  admins: [
    'rajarshhi@gmail.com',
    'admin@rajarshi-mess.com',
    'main.admin@example.com'
  ]
};

/**
 * Sample Students Data with Different Financial Scenarios
 */
const sampleStudents = [
  // Scenario 1: Student with outstanding balance (owes money)
  {
    name: "Arjun Kumar",
    phone: "+91-9876543210",
    firebaseUid: null,
    floor: "2nd",
    bedType: "Bed",
    moveInDate: new Date("2025-01-15"),
    securityDeposit: 1000,
    advanceDeposit: 1600,
    rentAtJoining: 1600,
    currentRent: 1600,
    totalDepositAgreed: 4200, // 1000 + 1600 + 1600
    currentOutstandingBalance: 800, // Student owes 800
    isActive: true,
    optedForWifi: true
  },
  
  // Scenario 2: Student with credit balance (gets refund)
  {
    name: "Priya Sharma",
    phone: "+91-9876543211",
    firebaseUid: null,
    floor: "2nd",
    bedType: "Special Room",
    moveInDate: new Date("2025-02-01"),
    securityDeposit: 1000,
    advanceDeposit: 1700,
    rentAtJoining: 1700,
    currentRent: 1700,
    totalDepositAgreed: 4400, // 1000 + 1700 + 1700
    currentOutstandingBalance: -300, // Student has 300 credit
    isActive: true,
    optedForWifi: true
  },
  
  // Scenario 3: Student perfectly settled (no refund, no debt)
  {
    name: "Vikram Singh",
    phone: "+91-9876543212",
    firebaseUid: null,
    floor: "3rd",
    bedType: "Room",
    moveInDate: new Date("2025-01-01"),
    securityDeposit: 1000,
    advanceDeposit: 3200,
    rentAtJoining: 3200,
    currentRent: 3200,
    totalDepositAgreed: 7400, // 1000 + 3200 + 3200
    currentOutstandingBalance: 0, // Perfectly settled
    isActive: true,
    optedForWifi: false
  },
  
  // Scenario 4: Student with large outstanding balance
  {
    name: "Anita Patel",
    phone: "+91-9876543213",
    firebaseUid: null,
    floor: "2nd",
    bedType: "Room",
    moveInDate: new Date("2024-12-01"),
    securityDeposit: 1000,
    advanceDeposit: 3200,
    rentAtJoining: 3200,
    currentRent: 3200,
    totalDepositAgreed: 7400, // 1000 + 3200 + 3200
    currentOutstandingBalance: 2500, // Student owes 2500
    isActive: true,
    optedForWifi: true
  },
  
  // Scenario 5: Student with high credit (overpaid)
  {
    name: "Rahul Verma",
    phone: "+91-9876543214",
    firebaseUid: null,
    floor: "3rd",
    bedType: "Bed",
    moveInDate: new Date("2025-03-01"),
    securityDeposit: 1000,
    advanceDeposit: 1600,
    rentAtJoining: 1600,
    currentRent: 1600,
    totalDepositAgreed: 4200, // 1000 + 1600 + 1600
    currentOutstandingBalance: -1200, // Student has large credit
    isActive: true,
    optedForWifi: true
  },
  
  // Scenario 6: Student with minimal debt
  {
    name: "Sneha Gupta",
    phone: "+91-9876543215",
    firebaseUid: null,
    floor: "2nd",
    bedType: "Bed",
    moveInDate: new Date("2025-04-01"),
    securityDeposit: 1000,
    advanceDeposit: 1600,
    rentAtJoining: 1600,
    currentRent: 1600,
    totalDepositAgreed: 4200,
    currentOutstandingBalance: 50, // Small amount owed
    isActive: true,
    optedForWifi: false
  },
  
  // Scenario 7: Inactive student (already left)
  {
    name: "Rohit Mehta",
    phone: "+91-9876543216",
    firebaseUid: null,
    floor: "3rd",
    bedType: "Room",
    moveInDate: new Date("2024-08-01"),
    securityDeposit: 1000,
    advanceDeposit: 3200,
    rentAtJoining: 3200,
    currentRent: 3200,
    totalDepositAgreed: 7400,
    currentOutstandingBalance: -500, // Left with credit
    isActive: false,
    optedForWifi: false,
    leaveDate: new Date("2025-05-15")
  },
  
  // Scenario 8: Student with WiFi, good standing
  {
    name: "Kavya Reddy",
    phone: "+91-9876543217",
    firebaseUid: null,
    floor: "2nd",
    bedType: "Special Room",
    moveInDate: new Date("2025-02-15"),
    securityDeposit: 1000,
    advanceDeposit: 1700,
    rentAtJoining: 1700,
    currentRent: 1700,
    totalDepositAgreed: 4400,
    currentOutstandingBalance: 200, // Small outstanding
    isActive: true,
    optedForWifi: true
  }
];

/**
 * Generate rent history for a student
 */
function generateRentHistory(student, monthsBack = 3) {
  const history = [];
  const currentDate = new Date();
  
  for (let i = monthsBack; i >= 0; i--) {
    const billDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const billingMonth = `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Skip if before move-in date
    if (billDate < student.moveInDate) continue;
    
    const isJoiningMonth = billDate.getMonth() === student.moveInDate.getMonth() && 
                          billDate.getFullYear() === student.moveInDate.getFullYear();
    
    let record;
    
    if (isJoiningMonth) {
      // Initial joining record
      const shortfall = Math.max(0, student.totalDepositAgreed - (student.totalDepositAgreed - student.currentOutstandingBalance));
      
      record = {
        billingMonth,
        rent: student.rentAtJoining,
        electricity: 0,
        wifi: 0,
        previousOutstanding: 0,
        expenses: shortfall > 0 ? [{ description: "Joining Shortfall", amount: shortfall }] : [],
        totalDue: student.rentAtJoining + shortfall,
        amountPaid: student.totalDepositAgreed - student.currentOutstandingBalance,
        currentOutstanding: Math.max(0, student.rentAtJoining + shortfall - (student.totalDepositAgreed - student.currentOutstandingBalance)),
        status: shortfall === 0 ? 'Paid' : 'Partially Paid',
        notes: "Initial joining record"
      };
    } else {
      // Regular monthly bill
      const electricity = Math.floor(Math.random() * 200) + 100; // 100-300
      const wifi = student.optedForWifi ? Math.floor(globalConfig.wifiMonthlyCharge / globalConfig.activeStudentCounts.wifiOpted) : 0;
      const previousOutstanding = i === monthsBack ? 0 : Math.floor(Math.random() * 500);
      
      const totalDue = student.currentRent + electricity + wifi + previousOutstanding;
      const amountPaid = Math.floor(Math.random() * totalDue * 1.2); // Sometimes overpay
      const currentOutstanding = totalDue - amountPaid;
      
      let status = 'Due';
      if (currentOutstanding <= 0) status = 'Paid';
      else if (amountPaid > 0) status = 'Partially Paid';
      if (amountPaid > totalDue) status = 'Overpaid';
      
      record = {
        billingMonth,
        rent: student.currentRent,
        electricity,
        wifi,
        previousOutstanding,
        expenses: [],
        totalDue,
        amountPaid,
        currentOutstanding,
        status,
        notes: `Regular bill for ${billingMonth}`
      };
    }
    
    history.push(record);
  }
  
  return history;
}

/**
 * Create all mock data
 */
async function createMockData() {
  try {
    console.log('🚀 Creating mock test data...');
    
    // 1. Create global configuration
    console.log('📋 Setting up global configuration...');
    await setDoc(doc(db, 'config', 'globalSettings'), {
      ...globalConfig,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // 2. Create students and their rent history
    console.log('👥 Creating sample students...');
    let createdCount = 0;
    
    for (const studentData of sampleStudents) {
      // Create student document
      const studentRef = await addDoc(collection(db, 'students'), {
        ...studentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Generate and create rent history
      const rentHistory = generateRentHistory(studentData);
      for (const record of rentHistory) {
        await setDoc(doc(db, 'students', studentRef.id, 'rentHistory', record.billingMonth), {
          ...record,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      createdCount++;
      console.log(`✅ Created student: ${studentData.name} (ID: ${studentRef.id})`);
      console.log(`   💰 Deposit: ₹${studentData.totalDepositAgreed}, Outstanding: ₹${studentData.currentOutstandingBalance}`);
      console.log(`   📊 Settlement: ₹${studentData.totalDepositAgreed - studentData.currentOutstandingBalance} ${
        studentData.totalDepositAgreed - studentData.currentOutstandingBalance > 0 ? '(Refund Due)' : 
        studentData.totalDepositAgreed - studentData.currentOutstandingBalance < 0 ? '(Payment Due)' : '(Settled)'
      }`);
      console.log(`   📝 Rent history: ${rentHistory.length} records`);
      console.log('');
    }
    
    console.log(`🎉 Mock data creation complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Global config: ✅`);
    console.log(`   - Students created: ${createdCount}`);
    console.log(`   - Active students: ${sampleStudents.filter(s => s.isActive).length}`);
    console.log(`   - Inactive students: ${sampleStudents.filter(s => !s.isActive).length}`);
    console.log(`   - WiFi opted: ${sampleStudents.filter(s => s.optedForWifi && s.isActive).length}`);
    console.log('');
    console.log('💡 Test scenarios created:');
    console.log('   1. Students with outstanding balance (debt)');
    console.log('   2. Students with credit balance (refund due)');
    console.log('   3. Students perfectly settled');
    console.log('   4. Inactive students (already left)');
    console.log('   5. Various rent types and floors');
    console.log('');
    console.log('🧪 Ready for testing delete calculation and other features!');
    
  } catch (error) {
    console.error('❌ Error creating mock data:', error);
    throw error;
  }
}

// Auto-run when called directly
createMockData().catch(console.error);

export { createMockData, globalConfig, sampleStudents };
