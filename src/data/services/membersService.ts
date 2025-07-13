/**
 * Members Service
 * 
 * Handles member data and operations.
 * In production, this will call Firebase Functions.
 */

import type { Member, Floor } from '../../shared/types/firestore-types';
import { dataStore, createMockTimestamp } from '../mock/mockData';
import { 
  simulateNetworkDelay, 
  simulateRandomError, 
  ServiceError,
  validatePhoneNumber,
  validateAmount,
  generateMemberId,
} from '../utils/serviceUtils';

export class MembersService {
  /**
   * Fetch all members with optional filtering
   * Future: Will call Firebase Function or direct Firestore query
   */
  static async getMembers(filters?: {
    isActive?: boolean;
    floor?: Floor;
    optedForWifi?: boolean;
  }): Promise<Member[]> {
    await simulateNetworkDelay();
    simulateRandomError();

    let filteredMembers = [...dataStore.members];

    if (filters?.isActive !== undefined) {
      filteredMembers = filteredMembers.filter(m => m.isActive === filters.isActive);
    }

    if (filters?.floor) {
      filteredMembers = filteredMembers.filter(m => m.floor === filters.floor);
    }

    if (filters?.optedForWifi !== undefined) {
      filteredMembers = filteredMembers.filter(m => m.optedForWifi === filters.optedForWifi);
    }

    return filteredMembers;
  }

  /**
   * Fetch a single member by ID
   * Future: Will call Firebase Function or direct Firestore read
   */
  static async getMember(memberId: string): Promise<Member | null> {
    await simulateNetworkDelay();
    simulateRandomError();

    const member = dataStore.members.find(m => m.id === memberId);
    return member ? { ...member } : null;
  }

  /**
   * Search members by name or phone
   * Future: Will use Firestore text search or Algolia
   */
  static async searchMembers(query: string, activeOnly = true): Promise<Member[]> {
    await simulateNetworkDelay(100, 300); // Faster for search
    simulateRandomError(0.02); // Lower error rate for search

    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return [];

    let searchPool = dataStore.members;
    if (activeOnly) {
      searchPool = searchPool.filter(m => m.isActive);
    }

    return searchPool.filter(member =>
      member.name.toLowerCase().includes(searchTerm) ||
      member.phone.includes(searchTerm)
    );
  }

  /**
   * Add a new member
   * Future: Will call Firebase Function for complex validation and creation
   */
  static async addMember(memberData: Omit<Member, 'id' | 'totalAgreedDeposit'>): Promise<Member> {
    await simulateNetworkDelay(800, 1200); // Longer delay for complex operation
    simulateRandomError();

    // Validation
    if (!memberData.name?.trim()) {
      throw new ServiceError('validation/required-field', 'Member name is required', { field: 'name' });
    }

    if (!memberData.phone?.trim()) {
      throw new ServiceError('validation/required-field', 'Phone number is required', { field: 'phone' });
    }

    // Phone format validation
    if (!validatePhoneNumber(memberData.phone)) {
      throw new ServiceError('validation/invalid-phone', 'Invalid phone number format. Use +91XXXXXXXXXX');
    }

    // Check for duplicate phone numbers
    const existingMember = dataStore.members.find(m => m.phone === memberData.phone);
    if (existingMember) {
      throw new ServiceError('business/duplicate-member', 'A member with this phone number already exists');
    }

    // Validate floor and bed type
    if (!dataStore.globalSettings.floors.includes(memberData.floor)) {
      throw new ServiceError('validation/invalid-floor', `Invalid floor: ${memberData.floor}`);
    }

    const floorBedTypes = dataStore.globalSettings.bedTypes[memberData.floor];
    if (!floorBedTypes || !(memberData.bedType in floorBedTypes)) {
      throw new ServiceError('validation/invalid-bed-type', `Invalid bed type for floor ${memberData.floor}: ${memberData.bedType}`);
    }

    // Validate monetary values
    if (!validateAmount(memberData.securityDeposit) || 
        !validateAmount(memberData.rentAtJoining) || 
        !validateAmount(memberData.advanceDeposit) ||
        !validateAmount(memberData.currentRent) ||
        !validateAmount(memberData.outstandingBalance)) {
      throw new ServiceError('validation/invalid-amount', 'All monetary amounts must be non-negative');
    }

    // Create new member
    const newMember: Member = {
      ...memberData,
      id: generateMemberId(),
      totalAgreedDeposit: memberData.securityDeposit + memberData.rentAtJoining + memberData.advanceDeposit,
    };

    // Update global counters (simulating atomic transaction)
    if (newMember.isActive) {
      dataStore.globalSettings.activememberCounts.total += 1;
      dataStore.globalSettings.activememberCounts.byFloor[memberData.floor] += 1;
      if (memberData.optedForWifi) {
        dataStore.globalSettings.activememberCounts.wifiOptedIn += 1;
      }
    }

    dataStore.members.push(newMember);
    return newMember;
  }

  /**
   * Update an existing member
   * Future: Will call Firebase Function for validation and update
   */
  static async updateMember(memberId: string, updates: Partial<Member>): Promise<Member> {
    await simulateNetworkDelay();
    simulateRandomError();

    const memberIndex = dataStore.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      throw new ServiceError('business/member-not-found', 'Member not found');
    }

    const currentMember = dataStore.members[memberIndex];

    // Handle WiFi opt-in changes for counter updates
    if (updates.optedForWifi !== undefined && updates.optedForWifi !== currentMember.optedForWifi) {
      if (updates.optedForWifi) {
        dataStore.globalSettings.activememberCounts.wifiOptedIn += 1;
      } else {
        dataStore.globalSettings.activememberCounts.wifiOptedIn -= 1;
      }
    }

    // Handle floor changes
    if (updates.floor && updates.floor !== currentMember.floor) {
      dataStore.globalSettings.activememberCounts.byFloor[currentMember.floor] -= 1;
      dataStore.globalSettings.activememberCounts.byFloor[updates.floor] += 1;
    }

    // Handle active status changes
    if (updates.isActive !== undefined && updates.isActive !== currentMember.isActive) {
      if (updates.isActive) {
        dataStore.globalSettings.activememberCounts.total += 1;
        dataStore.globalSettings.activememberCounts.byFloor[currentMember.floor] += 1;
        if (currentMember.optedForWifi) {
          dataStore.globalSettings.activememberCounts.wifiOptedIn += 1;
        }
      } else {
        dataStore.globalSettings.activememberCounts.total -= 1;
        dataStore.globalSettings.activememberCounts.byFloor[currentMember.floor] -= 1;
        if (currentMember.optedForWifi) {
          dataStore.globalSettings.activememberCounts.wifiOptedIn -= 1;
        }
      }
    }

    // Recalculate totalAgreedDeposit if deposit fields change
    const updatedMember = { ...currentMember, ...updates };
    if (updates.securityDeposit !== undefined || 
        updates.rentAtJoining !== undefined || 
        updates.advanceDeposit !== undefined) {
      updatedMember.totalAgreedDeposit = 
        updatedMember.securityDeposit + 
        updatedMember.rentAtJoining + 
        updatedMember.advanceDeposit;
    }

    dataStore.members[memberIndex] = updatedMember;
    return updatedMember;
  }

  /**
   * Deactivate a member
   * Future: Will call Firebase Function for complex settlement calculation
   */
  static async deactivateMember(memberId: string, leaveDate: Date): Promise<{
    finalOutstanding: number;
    refundAmount: number;
    settlementDetails: string;
  }> {
    await simulateNetworkDelay(1000, 1500); // Longer delay for complex calculation
    simulateRandomError();

    const memberIndex = dataStore.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      throw new ServiceError('business/member-not-found', 'Member not found');
    }

    const member = dataStore.members[memberIndex];
    if (!member.isActive) {
      throw new ServiceError('business/member-not-active', 'Member is already inactive');
    }

    // Simple settlement calculation (full logic will be in Firebase Function)
    const finalOutstanding = member.outstandingBalance;
    const refundAmount = finalOutstanding < 0 ? Math.abs(finalOutstanding) : 0;
    const paymentDue = finalOutstanding > 0 ? finalOutstanding : 0;

    let settlementDetails: string;
    if (paymentDue > 0) {
      settlementDetails = `Payment due: ₹${paymentDue}`;
    } else if (refundAmount > 0) {
      settlementDetails = `Refund due: ₹${refundAmount}`;
    } else {
      settlementDetails = 'Account settled';
    }

    // Update member status
    const updatedMember = {
      ...member,
      isActive: false,
      leaveDate: createMockTimestamp(leaveDate),
      ttlExpiry: createMockTimestamp(new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)), // 6 months from now
    };

    // Update counters
    dataStore.globalSettings.activememberCounts.total -= 1;
    dataStore.globalSettings.activememberCounts.byFloor[member.floor] -= 1;
    if (member.optedForWifi) {
      dataStore.globalSettings.activememberCounts.wifiOptedIn -= 1;
    }

    dataStore.members[memberIndex] = updatedMember;

    return {
      finalOutstanding,
      refundAmount,
      settlementDetails,
    };
  }

  /**
   * Permanently delete an inactive member
   * Future: Will call Firebase Function for safe deletion
   */
  static async deleteMember(memberId: string): Promise<void> {
    await simulateNetworkDelay();
    simulateRandomError();

    const memberIndex = dataStore.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      throw new ServiceError('business/member-not-found', 'Member not found');
    }

    const member = dataStore.members[memberIndex];
    if (member.isActive) {
      throw new ServiceError('business/member-still-active', 'Cannot delete active member. Deactivate first.');
    }

    // Remove from data store
    dataStore.members.splice(memberIndex, 1);

    // Also remove related rent history data
    dataStore.rentHistory = dataStore.rentHistory.filter(rh => rh.id !== memberId);
  }

  /**
   * Get member statistics
   * Future: Will call Firebase Function for real-time stats
   */
  static async getMemberStats(): Promise<{
    totalActive: number;
    totalInactive: number;
    wifiOptedIn: number;
    byFloor: Record<string, number>;
    totalOutstanding: number;
  }> {
    await simulateNetworkDelay(100, 200);
    
    const activeMembers = dataStore.members.filter(m => m.isActive);
    const inactiveMembers = dataStore.members.filter(m => !m.isActive);
    
    const byFloor = activeMembers.reduce((acc, member) => {
      acc[member.floor] = (acc[member.floor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalOutstanding = activeMembers
      .filter(m => m.outstandingBalance > 0)
      .reduce((sum, m) => sum + m.outstandingBalance, 0);

    return {
      totalActive: activeMembers.length,
      totalInactive: inactiveMembers.length,
      wifiOptedIn: activeMembers.filter(m => m.optedForWifi).length,
      byFloor,
      totalOutstanding,
    };
  }
}
