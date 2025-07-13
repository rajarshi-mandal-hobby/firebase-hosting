/**
 * Example Usage of the New Service Architecture
 * 
 * This file demonstrates how to use the refactored service layer.
 * Each service is now focused and maintainable.
 */

import FirestoreService, { ServiceError } from './firestoreService';

// Example: Basic member operations
export async function exampleMemberOperations() {
  try {
    console.log('=== Member Operations Example ===');
    
    // Fetch active members
    const activeMembers = await FirestoreService.Members.getMembers({ isActive: true });
    console.log(`Found ${activeMembers.length} active members`);

    // Search for members
    const searchResults = await FirestoreService.Members.searchMembers('John');
    console.log(`Search results:`, searchResults);

    // Get member statistics
    const stats = await FirestoreService.Members.getMemberStats();
    console.log('Member statistics:', stats);

  } catch (error) {
    if (error instanceof ServiceError) {
      console.error(`Service Error [${error.code}]:`, error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example: Configuration management
export async function exampleConfigOperations() {
  try {
    console.log('=== Config Operations Example ===');
    
    // Get global settings
    const settings = await FirestoreService.Config.getGlobalSettings();
    console.log('Current settings:', settings);

    // Get admin configuration
    const adminConfig = await FirestoreService.Config.getAdminConfig();
    console.log(`Current admins: ${adminConfig.list.length}`);

  } catch (error) {
    if (error instanceof ServiceError) {
      console.error(`Config Error [${error.code}]:`, error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example: Billing operations
export async function exampleBillingOperations() {
  try {
    console.log('=== Billing Operations Example ===');
    
    // Get electric bill history
    const billHistory = await FirestoreService.Billing.getElectricBillHistory(6);
    console.log(`Found ${billHistory.length} bills in history`);

    // Get current month bill
    const currentMonth = FirestoreService.Utility.getCurrentBillingMonth();
    const currentBill = await FirestoreService.Billing.getElectricBill(currentMonth);
    console.log('Current month bill:', currentBill);

  } catch (error) {
    if (error instanceof ServiceError) {
      console.error(`Billing Error [${error.code}]:`, error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example: Real-time subscriptions
export function exampleRealtimeSubscriptions() {
  console.log('=== Real-time Subscriptions Example ===');
  
  // Subscribe to global settings
  const unsubscribeSettings = FirestoreService.Realtime.subscribeToGlobalSettings((settings) => {
    console.log('Settings updated:', {
      totalMembers: settings.activememberCounts.total,
      wifiOptedIn: settings.activememberCounts.wifiOptedIn,
    });
  });

  // Subscribe to active members
  const unsubscribeMembers = FirestoreService.Realtime.subscribeToActiveMembers((members) => {
    console.log(`Active members updated: ${members.length} members`);
  });

  // Cleanup after 10 seconds (for demo)
  setTimeout(() => {
    console.log('Cleaning up subscriptions...');
    unsubscribeSettings();
    unsubscribeMembers();
  }, 10000);
}

// Example: Utility functions
export function exampleUtilityFunctions() {
  console.log('=== Utility Functions Example ===');
  
  // Format currency
  const amount = 1500;
  const formatted = FirestoreService.Utility.formatCurrency(amount);
  console.log(`Formatted amount: ${formatted}`);

  // Format billing month
  const billingMonth = '2025-07';
  const formattedMonth = FirestoreService.Utility.formatBillingMonth(billingMonth);
  console.log(`Formatted month: ${formattedMonth}`);

  // Get current and next billing months
  const current = FirestoreService.Utility.getCurrentBillingMonth();
  const next = FirestoreService.Utility.getNextBillingMonth();
  console.log(`Current: ${current}, Next: ${next}`);
}

// Run all examples
export async function runAllExamples() {
  console.log('🚀 Starting Service Layer Examples...\n');
  
  await exampleMemberOperations();
  console.log();
  
  await exampleConfigOperations();
  console.log();
  
  await exampleBillingOperations();
  console.log();
  
  exampleRealtimeSubscriptions();
  console.log();
  
  exampleUtilityFunctions();
  
  console.log('\n✅ All examples completed!');
}

// Export for easy testing
export default {
  runAllExamples,
  exampleMemberOperations,
  exampleConfigOperations,
  exampleBillingOperations,
  exampleRealtimeSubscriptions,
  exampleUtilityFunctions,
};
