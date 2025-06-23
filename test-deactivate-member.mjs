import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

// Firebase config for emulator
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to emulators
connectFunctionsEmulator(functions, 'localhost', 5001);

// Test deactivate member function
async function testDeactivateMember() {
  try {
    console.log('🧪 Testing deactivateMember function...');
    
    // First, let's list all current members
    console.log('\n📋 Current members:');
    const membersCollection = collection(db, 'members');
    const membersSnapshot = await getDocs(membersCollection);
    
    const members = [];
    membersSnapshot.forEach(doc => {
      const data = doc.data();
      members.push({
        id: doc.id,
        name: data.name,
        isActive: data.isActive,
        floor: data.floor,
        bedType: data.bedType
      });
      console.log(`  - ${doc.id}: ${data.name} (Active: ${data.isActive})`);
    });
    
    if (members.length === 0) {
      console.log('❌ No members found in database');
      return;
    }
    
    // Find an active member to deactivate
    const activeMember = members.find(m => m.isActive);
    if (!activeMember) {
      console.log('❌ No active members found to deactivate');
      return;
    }
    
    console.log(`\n🎯 Attempting to deactivate member: ${activeMember.name} (${activeMember.id})`);
    
    // Call the deactivate function
    const deactivateMemberFunction = httpsCallable(functions, 'deactivateMember');
    const result = await deactivateMemberFunction({ memberId: activeMember.id });
    
    console.log('✅ Function call result:', result.data);
    
    // Verify the member was deactivated
    console.log('\n🔍 Verifying member status after deactivation...');
    const memberDoc = await getDoc(doc(db, 'members', activeMember.id));
    if (memberDoc.exists()) {
      const updatedData = memberDoc.data();
      console.log(`  - ${activeMember.name} isActive: ${updatedData.isActive}`);
      console.log(`  - Leave date: ${updatedData.leaveDate?.toDate()}`);
      console.log(`  - TTL expiry: ${updatedData.ttlExpiry?.toDate()}`);
      
      if (!updatedData.isActive) {
        console.log('✅ Member successfully deactivated!');
      } else {
        console.log('❌ Member is still active - deactivation failed');
      }
    } else {
      console.log('❌ Member document not found after deactivation');
    }
    
  } catch (error) {
    console.error('❌ Error testing deactivateMember:', error);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    if (error.message) {
      console.error('   Error message:', error.message);
    }
  }
}

// Run the test
testDeactivateMember().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
