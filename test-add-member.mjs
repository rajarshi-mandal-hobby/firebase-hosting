#!/usr/bin/env node

// Simple test script to add a member via the cloud function
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

// Create the function reference
const addMemberFunction = httpsCallable(functions, 'addMember');

// Test data
const testMemberData = {
  name: 'Test Member',
  phone: '1234567890',
  floor: '2nd',
  bedType: 'Bed',
  moveInDate: new Date().toISOString(),
  securityDeposit: 5000,
  advanceDeposit: 3000,
  rentAtJoining: 3000,
  fullPayment: true,
  actualAmountPaid: 11000
};

// Test the function
async function testAddMember() {
  try {
    console.log('Testing add member function...');
    console.log('Test data:', JSON.stringify(testMemberData, null, 2));
    
    const result = await addMemberFunction(testMemberData);
    console.log('Success:', result.data);
  } catch (error) {
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
  }
}

testAddMember();
