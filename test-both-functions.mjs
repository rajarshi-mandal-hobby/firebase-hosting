#!/usr/bin/env node

// Simple test to verify member function emulator detection
import { initializeApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

// Initialize Firebase with emulator
const firebaseConfig = {
  projectId: 'rajarshi-mess',
  apiKey: 'demo-api-key',
  authDomain: 'rajarshi-mess.firebaseapp.com',
  storageBucket: 'rajarshi-mess.appspot.com',
  messagingSenderId: '123456789',
  appId: 'demo-app-id'
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'asia-south1');

// Connect to emulator
connectFunctionsEmulator(functions, 'localhost', 5001);

// Create the config function reference to test working config call
const saveConfigFunction = httpsCallable(functions, 'saveConfiguration');

// Test minimal config data
const testConfigData = {
  bedTypes: {
    "2nd": {
      "Bed": 1600
    }
  },
  defaultSecurityDeposit: 1000,
  wifiMonthlyCharge: 500
};

// Test both config and member functions
async function testBothFunctions() {
  console.log('Testing both config and member functions...\n');
  
  try {
    console.log('1. Testing config function (should work)...');
    const configResult = await saveConfigFunction(testConfigData);
    console.log('✅ Config function success:', configResult.data);
  } catch (error) {
    console.error('❌ Config function error:', error.code, error.message);
  }
  
  console.log('\n2. Testing member function (currently failing)...');
  try {
    const addMemberFunction = httpsCallable(functions, 'addMember');
    const testMemberData = {
      name: 'Test Member 2',
      phone: '9876543210',
      floor: '2nd',
      bedType: 'Bed',
      moveInDate: new Date().toISOString(),
      securityDeposit: 5000,
      advanceDeposit: 3000,
      rentAtJoining: 3000,
      fullPayment: true,
      actualAmountPaid: 11000
    };
    
    const memberResult = await addMemberFunction(testMemberData);
    console.log('✅ Member function success:', memberResult.data);
  } catch (error) {
    console.error('❌ Member function error:', error.code, error.message);
    console.error('Full error details:', error);
  }
}

testBothFunctions();
