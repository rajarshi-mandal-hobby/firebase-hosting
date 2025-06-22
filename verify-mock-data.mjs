/**
 * Simple Data Verification
 * Check if mock data was created correctly
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "rajarshi-mess",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

try {
  connectFirestoreEmulator(db, 'localhost', 8080);
} catch (error) {
  console.log('Emulator already connected');
}

async function verifyData() {
  try {
    console.log('🔍 Verifying Mock Data...\n');
    
    // Check students
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    console.log(`👥 Students: ${studentsSnapshot.size} found`);
    
    studentsSnapshot.forEach(doc => {
      const student = doc.data();
      const refund = student.totalDepositAgreed - student.currentOutstandingBalance;
      console.log(`   ${student.name} (${doc.id}): ₹${refund} ${refund > 0 ? 'refund' : refund < 0 ? 'payment due' : 'settled'}`);
    });
    
    console.log('\n✅ Data verification complete!');
    console.log('\n💡 You can now test the delete calculation in the UI:');
    console.log('   1. Open http://localhost:5173');
    console.log('   2. Go to Admin Dashboard > Members');
    console.log('   3. Click the menu (⋮) on any student');
    console.log('   4. Select "Delete Student"');
    console.log('   5. Verify the settlement calculation matches the expected values above');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyData();
