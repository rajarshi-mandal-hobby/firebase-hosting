/**
 * Firebase Member Dashboard Service
 *
 * Calls Firebase Functions to fetch member dashboard data from Firestore
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../firebase';
import type { RentHistory, Member, CloudFunctionResponse } from '../../../shared/types/firestore-types';

// Firebase Function callable references
const getMemberDashboardFn = httpsCallable<
  { memberId?: string },
  CloudFunctionResponse<{
    member: Member;
    currentMonth?: RentHistory;
    globalSettings: {
      upiVpa?: string;
      payeeName?: string;
    };
  }>
>(functions, 'getMemberDashboard');

const getMemberRentHistoryFn = httpsCallable<
  { memberId: string; limit?: number; startAfter?: string },
  CloudFunctionResponse<{
    rentHistory: RentHistory[];
    hasMore: boolean;
    nextCursor?: string;
  }>
>(functions, 'getMemberRentHistory');

const getOtherActiveMembersFn = httpsCallable<
  void,
  CloudFunctionResponse<{
    members: Array<{
      id: string;
      name: string;
      phone: string;
      floor: string;
      bedType: string;
    }>;
  }>
>(functions, 'getOtherActiveMembers');

/**
 * Get member dashboard data
 * If no memberId provided, uses authenticated user's data
 */
export async function getMemberDashboard(memberId?: string) {
  try {
    const request = memberId ? { memberId } : {};
    const result = await getMemberDashboardFn(request);

    if (!result.data.success) {
      throw new Error(result.data.message || 'Failed to get member dashboard');
    }

    if (!result.data.data) {
      throw new Error('No data returned from member dashboard');
    }

    return {
      member: result.data.data.member,
      currentMonth: result.data.data.currentMonth,
      upi: {
        upiVpa: result.data.data.globalSettings.upiVpa,
        payeeName: result.data.data.globalSettings.payeeName,
      },
    };
  } catch (error) {
    console.error('Error getting member dashboard:', error);
    throw error;
  }
}

/**
 * Get member rent history
 * If no memberId provided, uses authenticated user's data
 */
export async function getMemberRentHistory(limit: number = 12, startAfter?: string, memberId?: string) {
  try {
    // For now, we need to provide a memberId since the Firebase Function requires it
    // TODO: When auth is implemented, get the member ID from the authenticated user
    const actualMemberId = memberId || 'member-1'; // Fallback for testing

    const request: { limit: number; startAfter?: string; memberId: string } = {
      limit,
      memberId: actualMemberId,
      ...(startAfter && { startAfter }),
    };

    const result = await getMemberRentHistoryFn(request);

    if (!result.data.success) {
      throw new Error(result.data.message || 'Failed to get rent history');
    }

    if (!result.data.data) {
      throw new Error('No data returned from rent history');
    }

    // Return the complete response with pagination info
    return {
      rentHistory: result.data.data.rentHistory,
      hasMore: result.data.data.hasMore,
      nextCursor: result.data.data.nextCursor,
    };
  } catch (error) {
    console.error('Error getting rent history:', error);
    throw error;
  }
}

/**
 * Get all other active members (for friends section)
 */
export async function getOtherActiveMembers() {
  try {
    const result = await getOtherActiveMembersFn();

    if (!result.data.success) {
      throw new Error(result.data.message || 'Failed to get other members');
    }

    if (!result.data.data) {
      throw new Error('No data returned from members');
    }

    // Return the members array from the response
    return result.data.data.members;
  } catch (error) {
    console.error('Error getting other members:', error);
    throw error;
  }
}
