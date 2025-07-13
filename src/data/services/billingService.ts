/**
 * Billing Service
 * 
 * Handles bill generation and electricity cost management.
 * In production, this will call Firebase Functions.
 */

import type { ElectricBill } from '../../shared/types/firestore-types';
import { dataStore, createMockTimestamp } from '../mock/mockData';
import { 
  simulateNetworkDelay, 
  simulateRandomError, 
  ServiceError,
  validateBillingMonth,
} from '../utils/serviceUtils';

export class BillingService {
  /**
   * Generate monthly bills for all active members
   * Future: Will call Firebase Function for complex billing logic
   */
  static async generateMonthlyBills(params: {
    billingMonth: string; // YYYY-MM format
    floorElectricityCosts: Record<string, number>;
    bulkExpenses: Array<{
      memberIds: string[];
      amount: number;
      description: string;
      type: 'individual' | 'split';
    }>;
    wifiMemberIds: string[];
  }): Promise<{
    totalMembersProcessed: number;
    totalChargesGenerated: number;
    electricBillId: string;
  }> {
    await simulateNetworkDelay(2000, 3000); // Long delay for complex operation
    simulateRandomError();

    const { billingMonth, floorElectricityCosts, bulkExpenses, wifiMemberIds } = params;

    // Validate billing month format
    if (!validateBillingMonth(billingMonth)) {
      throw new ServiceError('validation/invalid-format', 'Invalid billing month format. Use YYYY-MM');
    }

    // Check if billing already exists
    const existingBilling = dataStore.electricBills.some(bill => bill.id === billingMonth);
    if (existingBilling) {
      throw new ServiceError('business/billing-exists', 'Bills for this month have already been generated');
    }

    // Get active members
    const activeMembers = dataStore.members.filter(m => m.isActive);
    if (activeMembers.length === 0) {
      throw new ServiceError('business/no-active-members', 'No active members found');
    }

    // Validate floor costs
    for (const floor of dataStore.globalSettings.floors) {
      if (!(floor in floorElectricityCosts) || floorElectricityCosts[floor] < 0) {
        throw new ServiceError('validation/invalid-amount', `Invalid electricity cost for floor ${floor}`);
      }
    }

    // Calculate per-member costs
    const membersByFloor = activeMembers.reduce((acc, member) => {
      if (!acc[member.floor]) acc[member.floor] = [];
      acc[member.floor].push(member);
      return acc;
    }, {} as Record<string, typeof activeMembers>);

    // Create electric bill record
    const electricBill: ElectricBill = {
      id: billingMonth,
      billingMonth: createMockTimestamp(`${billingMonth}-01`),
      generatedAt: createMockTimestamp(),
      lastUpdated: createMockTimestamp(),
      floorCosts: {
        '2nd': { bill: 0, totalMembers: 0 },
        '3rd': { bill: 0, totalMembers: 0 },
      },
      appliedBulkExpenses: bulkExpenses.map(expense => ({
        members: expense.memberIds,
        amount: expense.amount,
        description: expense.description,
      })),
    };

    // Calculate floor costs
    for (const floor of dataStore.globalSettings.floors) {
      electricBill.floorCosts[floor] = {
        bill: floorElectricityCosts[floor],
        totalMembers: membersByFloor[floor]?.length || 0,
      };
    }

    dataStore.electricBills.push(electricBill);

    // Simulate bill generation for each member
    // In real implementation, this would create rent history records
    let totalChargesGenerated = 0;
    
    for (const member of activeMembers) {
      const electricityPerMember = membersByFloor[member.floor]?.length 
        ? floorElectricityCosts[member.floor] / membersByFloor[member.floor].length 
        : 0;
      
      const wifiCharge = wifiMemberIds.includes(member.id) 
        ? Math.ceil(dataStore.globalSettings.wifiMonthlyCharge / wifiMemberIds.length)
        : 0;

      // Calculate bulk expenses for this member
      let memberBulkExpenses = 0;
      for (const expense of bulkExpenses) {
        if (expense.memberIds.includes(member.id)) {
          memberBulkExpenses += expense.type === 'split' 
            ? expense.amount / expense.memberIds.length 
            : expense.amount;
        }
      }

      const totalCharges = member.currentRent + electricityPerMember + wifiCharge + memberBulkExpenses;
      totalChargesGenerated += totalCharges;
    }

    // Update global billing months
    dataStore.globalSettings.currentBillingMonth = createMockTimestamp(`${billingMonth}-01`);
    const nextMonth = new Date(`${billingMonth}-01`);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    dataStore.globalSettings.nextBillingMonth = createMockTimestamp(nextMonth);

    return {
      totalMembersProcessed: activeMembers.length,
      totalChargesGenerated: Math.round(totalChargesGenerated),
      electricBillId: billingMonth,
    };
  }

  /**
   * Fetch electricity bill history
   * Future: Will call Firebase Function or direct Firestore query
   */
  static async getElectricBillHistory(limit = 12): Promise<ElectricBill[]> {
    await simulateNetworkDelay();
    simulateRandomError();

    return dataStore.electricBills
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, limit);
  }

  /**
   * Fetch specific electric bill
   * Future: Will call Firebase Function or direct Firestore read
   */
  static async getElectricBill(billingMonth: string): Promise<ElectricBill | null> {
    await simulateNetworkDelay();
    simulateRandomError();

    const bill = dataStore.electricBills.find(bill => bill.id === billingMonth);
    return bill ? { ...bill } : null;
  }

  /**
   * Update electricity costs for a month
   * Future: Will call Firebase Function for validation and update
   */
  static async updateElectricBill(
    billingMonth: string, 
    updates: Partial<Pick<ElectricBill, 'floorCosts' | 'appliedBulkExpenses'>>
  ): Promise<ElectricBill> {
    await simulateNetworkDelay();
    simulateRandomError();

    const billIndex = dataStore.electricBills.findIndex(bill => bill.id === billingMonth);
    if (billIndex === -1) {
      throw new ServiceError('business/bill-not-found', 'Electric bill not found for this month');
    }

    const updatedBill = {
      ...dataStore.electricBills[billIndex],
      ...updates,
      lastUpdated: createMockTimestamp(),
    };

    dataStore.electricBills[billIndex] = updatedBill;
    return updatedBill;
  }

  /**
   * Delete a billing month (admin only, for corrections)
   * Future: Will call Firebase Function with proper validation
   */
  static async deleteBillingMonth(billingMonth: string): Promise<void> {
    await simulateNetworkDelay();
    simulateRandomError();

    const billIndex = dataStore.electricBills.findIndex(bill => bill.id === billingMonth);
    if (billIndex === -1) {
      throw new ServiceError('business/bill-not-found', 'Electric bill not found for this month');
    }

    // Remove electric bill
    dataStore.electricBills.splice(billIndex, 1);

    // In real implementation, would also remove related rent history records
    // and update member outstanding balances
  }
}
