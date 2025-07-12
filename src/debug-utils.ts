// Temporary test file to debug the utility functions
import { getActiveMembersWithLatestBills, calculateTotalOutstanding } from './utils/memberUtils';

console.log('=== Testing Utility Functions ===');

try {
  const activeMembersWithBills = getActiveMembersWithLatestBills();
  console.log('✅ getActiveMembersWithLatestBills result:', {
    length: activeMembersWithBills.length,
    data: activeMembersWithBills.slice(0, 2)
  });

  const totalOutstanding = calculateTotalOutstanding();
  console.log('✅ calculateTotalOutstanding result:', totalOutstanding);
} catch (error) {
  console.error('❌ Error testing utility functions:', error);
}
