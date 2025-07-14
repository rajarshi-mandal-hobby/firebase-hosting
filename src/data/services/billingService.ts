/**
 * Billing Service
 * 
 * Handles bill generation and electricity cost management.
 * Calls Firebase Cloud Functions for all operations.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';
import type { ElectricBill, RentHistory } from '../../shared/types/firestore-types';

// Request interfaces matching backend
interface GenerateBulkBillsRequest {
  billingMonth: string; // YYYY-MM format
  floorElectricity: {
    "2nd": number;
    "3rd": number;
  };
  floorMemberCounts: {
    "2nd": number;
    "3rd": number;
  };
  bulkExpenses?: {
    memberIds: string[];
    amount: number;
    description: string;
  }[];
  wifiCharges?: {
    memberIds: string[];
    amount: number;
  };
}

interface RecordPaymentRequest {
  memberId: string;
  month: string; // YYYY-MM format
  amount: number;
  note?: string;
}

interface BillingSummaryResponse {
  totalActiveMembers: number;
  totalDue: number;
  totalPaid: number;
  totalOutstanding: number;
  billingStatsByStatus: {
    Due: number;
    Paid: number;
    "Partially Paid": number;
    Overpaid: number;
  };
}

export class BillingService {
  /**
   * Generate monthly bills for all active members
   */
  static async generateBulkBills(params: GenerateBulkBillsRequest): Promise<{
    totalMembersProcessed: number;
    totalChargesGenerated: number;
    electricBillId: string;
  }> {
    const generateBulkBills = httpsCallable(functions, 'generateBulkBills');
    const result = await generateBulkBills(params);
    return result.data as {
      totalMembersProcessed: number;
      totalChargesGenerated: number;
      electricBillId: string;
    };
  }

  /**
   * Record payment for a member's rent
   */
  static async recordPayment(params: RecordPaymentRequest): Promise<RentHistory> {
    const recordPayment = httpsCallable(functions, 'recordPayment');
    const result = await recordPayment(params);
    return result.data as RentHistory;
  }

  /**
   * Get current electric bill
   */
  static async getCurrentElectricBill(): Promise<ElectricBill | null> {
    const getCurrentElectricBill = httpsCallable(functions, 'getCurrentElectricBill');
    const result = await getCurrentElectricBill();
    return result.data as ElectricBill | null;
  }

  /**
   * Get billing summary for admin dashboard
   */
  static async getBillingSummary(): Promise<BillingSummaryResponse> {
    const getBillingSummary = httpsCallable(functions, 'getBillingSummary');
    const result = await getBillingSummary();
    return result.data as BillingSummaryResponse;
  }

  // Legacy methods for backward compatibility - these will be removed once components are updated
  /**
   * @deprecated Use generateBulkBills instead
   */
  static async generateMonthlyBills(params: {
    billingMonth: string;
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
    // Convert old format to new format
    const newParams: GenerateBulkBillsRequest = {
      billingMonth: params.billingMonth,
      floorElectricity: {
        "2nd": params.floorElectricityCosts["2nd"] || 0,
        "3rd": params.floorElectricityCosts["3rd"] || 0,
      },
      floorMemberCounts: {
        "2nd": 0, // This will need to be calculated by backend
        "3rd": 0,
      },
      bulkExpenses: params.bulkExpenses.map(expense => ({
        memberIds: expense.memberIds,
        amount: expense.amount,
        description: expense.description,
      })),
      wifiCharges: params.wifiMemberIds.length > 0 ? {
        memberIds: params.wifiMemberIds,
        amount: 0, // This will be calculated by backend
      } : undefined,
    };

    return this.generateBulkBills(newParams);
  }

  /**
   * @deprecated Use getCurrentElectricBill instead
   */
  static async getElectricBillHistory(): Promise<ElectricBill[]> {
    // For now, just return current bill in array format
    const currentBill = await this.getCurrentElectricBill();
    return currentBill ? [currentBill] : [];
  }

  /**
   * @deprecated Use getCurrentElectricBill instead
   */
  static async getElectricBill(billingMonth: string): Promise<ElectricBill | null> {
    const currentBill = await this.getCurrentElectricBill();
    return (currentBill?.id === billingMonth) ? currentBill : null;
  }
}
