#!/usr/bin/env node

// Test the calculateSettlementPreview function in emulator mode
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

// Firebase config for emulator
const firebaseConfig = {
  projectId: 'demo-project',
  storageBucket: 'demo-project.appspot.com',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Connect to Functions emulator
connectFunctionsEmulator(functions, 'localhost', 5001);

console.log('🔧 Testing calculateSettlementPreview function...');

async function testSettlementPreview() {
  try {
    // Test with a member ID (we'll use a known member if exists, or create test data)
    const settlementPreview = httpsCallable(functions, 'calculateSettlementPreview');
    
    // First let's test with a dummy ID to see what happens
    const testMemberId = 'test-member-123';
    const testLeaveDate = new Date();
    
    console.log(`📊 Testing settlement preview for member: ${testMemberId}`);
    console.log(`📅 Leave date: ${testLeaveDate.toISOString()}`);
    
    const result = await settlementPreview({
      studentId: testMemberId, // Note: still using studentId parameter name for backward compatibility
      leaveDate: testLeaveDate.toISOString()
    });
    
    console.log('✅ Settlement preview result:', result.data);
      } catch (error) {
    console.error('❌ Error testing settlement preview:', error.message);
    console.error('🔍 Full error object:', error);
    
    // Check if it's a "not found" error (expected with dummy ID)
    if (error.message && error.message.includes('Member not found')) {
      console.log('ℹ️  Expected error - member not found. Function is working correctly!');
      console.log('ℹ️  The function successfully connected to the members collection.');
    } else if (error.message && error.message.includes('UNAUTHENTICATED')) {
      console.log('❌ Authentication error - emulator detection might not be working');
    } else if (error.code === 'functions/not-found') {
      console.log('❌ Function not found - the calculateSettlementPreview function is not deployed to the emulator');
    } else {
      console.log('❌ Unexpected error code:', error.code);
    }
  }
}

// Run the test
testSettlementPreview()
  .then(() => {
    console.log('🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
