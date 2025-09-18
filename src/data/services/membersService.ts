/**
 * Members Service
 *
 * Handles member data and operations using real Firestore.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QuerySnapshot,
  getDocsFromCache,
  getDocsFromServer,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type { Member, RentHistory } from '../../shared/types/firestore-types';
import {
  ServiceErrorDepricated,
  validatePhoneNumber,
  validateAmount,
  generateMemberId,
  simulateNetworkDelay,
} from '../utils/serviceUtils';
import type { Floor } from '../shemas/GlobalSettings';

export const getMembers = async ({
  refresh = false,
  ...filters
}: {
  isActive?: boolean;
  floor?: Floor;
  optedForWifi?: boolean;
  refresh?: boolean;
}): Promise<Member[]> => {
  const membersQuery = collection(db, 'members').withConverter<Member>({
    toFirestore: (members: Member) => members,
    fromFirestore: (snapshot) => {
      const data = snapshot.data() as Member;
      return data;
    },
  });

  await simulateNetworkDelay(1000);
  // Apply filters
  const constraints = [];
  if (filters?.isActive !== undefined) {
    constraints.push(where('isActive', '==', filters.isActive));
  }
  if (filters?.floor) {
    constraints.push(where('floor', '==', filters.floor));
  }
  if (filters?.optedForWifi !== undefined) {
    constraints.push(where('optedForWifi', '==', filters.optedForWifi));
  }

  // Create filtered query
  const q =
    constraints.length > 0
      ? query(membersQuery, ...constraints, orderBy('name'))
      : query(membersQuery, orderBy('name'));

  let snapshot: QuerySnapshot<Member, DocumentData>;

  if (refresh) {
    snapshot = await getDocsFromServer(q);
  } else {
    try {
      snapshot = await getDocsFromCache(q);
    } catch {
      snapshot = await getDocs(q);
    }
  }

  if (snapshot.empty) {
    throw new Error('No members found');
  }

  console.log('Members fetched:', snapshot.metadata.fromCache ? 'from cache' : 'from server');

  return snapshot.docs.map((doc) => doc.data());
};

export class MembersService {
  /**
   * Get a single member by ID from Firestore
   */
  static async getMember(memberId: string): Promise<Member | null> {
    try {
      const memberRef = doc(db, 'members', memberId);
      const memberDoc = await getDoc(memberRef);

      if (!memberDoc.exists()) {
        return null;
      }

      return {
        id: memberDoc.id,
        ...memberDoc.data(),
      } as Member;
    } catch (error) {
      console.error('Error fetching member:', error);
      throw new ServiceErrorDepricated('firestore/read-error', 'Failed to fetch member');
    }
  }

  /**
   * Get member rent history from subcollection
   */
  static async getMemberRentHistory(memberId: string, limitCount = 12): Promise<RentHistory[]> {
    try {
      const rentHistoryQuery = query(
        collection(db, 'members', memberId, 'rentHistory'),
        orderBy('generatedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(rentHistoryQuery);
      const rentHistory: RentHistory[] = [];

      snapshot.forEach((doc) => {
        rentHistory.push({
          id: doc.id,
          ...doc.data(),
        } as RentHistory);
      });

      return rentHistory;
    } catch (error) {
      console.error('Error fetching member rent history:', error);
      throw new ServiceErrorDepricated('firestore/read-error', 'Failed to fetch member rent history');
    }
  }

  /**
   * Search members by name or phone
   */
  static async searchMembers(searchTerm: string, activeOnly = true): Promise<Member[]> {
    try {
      // Get all members first (Firestore doesn't support full-text search)
      const members = await this.getMembers({ isActive: activeOnly ? true : undefined });

      // Filter by search term
      const searchLower = searchTerm.toLowerCase();
      return members.filter(
        (member) => member.name.toLowerCase().includes(searchLower) || member.phone.includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching members:', error);
      throw new ServiceErrorDepricated('firestore/read-error', 'Failed to search members');
    }
  }

  /**
   * Add a new member to Firestore
   */
  static async addMember(memberData: {
    name: string;
    phone: string;
    floor: Floor;
    bedType: string;
    rentAmount: number;
    securityDeposit: number;
    advanceDeposit: number;
    optedForWifi: boolean;
    moveInDate: Date;
  }): Promise<Member> {
    try {
      // Validation
      if (!validatePhoneNumber(memberData.phone)) {
        throw new ServiceErrorDepricated('validation/invalid-phone', 'Invalid phone number format');
      }

      if (!validateAmount(memberData.rentAmount)) {
        throw new ServiceErrorDepricated('validation/invalid-amount', 'Invalid rent amount');
      }

      if (!validateAmount(memberData.securityDeposit)) {
        throw new ServiceErrorDepricated('validation/invalid-amount', 'Invalid security deposit');
      }

      if (!validateAmount(memberData.advanceDeposit)) {
        throw new ServiceErrorDepricated('validation/invalid-amount', 'Invalid advance deposit');
      }

      // Check for duplicate phone number
      const existingMembers = await this.getMembers();
      const existingMember = existingMembers.find((m) => m.phone === memberData.phone);
      if (existingMember) {
        throw new ServiceErrorDepricated('business/duplicate-phone', 'Member with this phone number already exists');
      }

      // Generate member ID
      const memberId = generateMemberId();

      // Calculate total agreed deposit
      const totalAgreedDeposit = memberData.securityDeposit + memberData.advanceDeposit;

      // Create member object
      const newMember: Omit<Member, 'id'> = {
        name: memberData.name,
        phone: memberData.phone,
        floor: memberData.floor,
        bedType: memberData.bedType as Member['bedType'],
        moveInDate: Timestamp.fromDate(memberData.moveInDate),
        securityDeposit: memberData.securityDeposit,
        rentAtJoining: memberData.rentAmount,
        advanceDeposit: memberData.advanceDeposit,
        currentRent: memberData.rentAmount,
        totalAgreedDeposit,
        outstandingBalance: 0,
        isActive: true,
        optedForWifi: memberData.optedForWifi,
        // Optional fields set to undefined
        firebaseUid: undefined,
        fcmToken: undefined,
        outstandingNote: undefined,
        leaveDate: undefined,
        ttlExpiry: undefined,
      };

      // Save to Firestore
      const memberRef = doc(db, 'members', memberId);
      await setDoc(memberRef, newMember);

      return { id: memberId, ...newMember } as Member;
    } catch (error) {
      if (error instanceof ServiceErrorDepricated) {
        throw error;
      }
      console.error('Error adding member:', error);
      throw new ServiceErrorDepricated('firestore/write-error', 'Failed to add member');
    }
  }

  /**
   * Update an existing member in Firestore
   */
  static async updateMember(memberId: string, updates: Partial<Member>): Promise<Member> {
    try {
      // Validation for specific fields
      if (updates.phone && !validatePhoneNumber(updates.phone)) {
        throw new ServiceErrorDepricated('validation/invalid-phone', 'Invalid phone number format');
      }

      if (updates.currentRent && !validateAmount(updates.currentRent)) {
        throw new ServiceErrorDepricated('validation/invalid-amount', 'Invalid rent amount');
      }

      if (updates.securityDeposit && !validateAmount(updates.securityDeposit)) {
        throw new ServiceErrorDepricated('validation/invalid-amount', 'Invalid security deposit');
      }

      // Check if member exists
      const member = await this.getMember(memberId);
      if (!member) {
        throw new ServiceErrorDepricated('business/member-not-found', 'Member not found');
      }

      // Check for duplicate phone if phone is being updated
      if (updates.phone && updates.phone !== member.phone) {
        const existingMembers = await this.getMembers();
        const existingMember = existingMembers.find((m) => m.phone === updates.phone && m.id !== memberId);
        if (existingMember) {
          throw new ServiceErrorDepricated('business/duplicate-phone', 'Member with this phone number already exists');
        }
      }

      // Remove undefined fields and prepare updates
      const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));

      // Update in Firestore
      const memberRef = doc(db, 'members', memberId);
      await updateDoc(memberRef, cleanUpdates);

      // Return updated member
      const updatedMember = await this.getMember(memberId);
      return updatedMember!;
    } catch (error) {
      if (error instanceof ServiceErrorDepricated) {
        throw error;
      }
      console.error('Error updating member:', error);
      throw new ServiceErrorDepricated('firestore/write-error', 'Failed to update member');
    }
  }

  /**
   * Deactivate a member (set isActive to false)
   */
  static async deactivateMember(
    memberId: string,
    leaveDate: Date
  ): Promise<{
    finalOutstanding: number;
    refundAmount: number;
    settlementDetails: string;
  }> {
    try {
      const member = await this.getMember(memberId);
      if (!member) {
        throw new ServiceErrorDepricated('business/member-not-found', 'Member not found');
      }

      if (!member.isActive) {
        throw new ServiceErrorDepricated('business/member-not-active', 'Member is already inactive');
      }

      // Simple settlement calculation (real logic would be more complex)
      const finalOutstanding = member.outstandingBalance;
      const refundAmount = Math.max(0, member.securityDeposit + member.advanceDeposit - finalOutstanding);
      const settlementDetails = `Outstanding: ₹${finalOutstanding}, Refund: ₹${refundAmount}`;

      // Update member
      const memberRef = doc(db, 'members', memberId);
      await updateDoc(memberRef, {
        isActive: false,
        leaveDate: Timestamp.fromDate(leaveDate),
        ttlExpiry: Timestamp.fromDate(new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)), // 6 months from now
      });

      return {
        finalOutstanding,
        refundAmount,
        settlementDetails,
      };
    } catch (error) {
      if (error instanceof ServiceErrorDepricated) {
        throw error;
      }
      console.error('Error deactivating member:', error);
      throw new ServiceErrorDepricated('firestore/write-error', 'Failed to deactivate member');
    }
  }

  /**
   * Permanently delete an inactive member
   */
  static async deleteMember(memberId: string): Promise<void> {
    try {
      const member = await this.getMember(memberId);
      if (!member) {
        throw new ServiceErrorDepricated('business/member-not-found', 'Member not found');
      }

      if (member.isActive) {
        throw new ServiceErrorDepricated(
          'business/member-still-active',
          'Cannot delete active member. Deactivate first.'
        );
      }

      // Delete member document (this will also delete subcollections when using Firebase Functions)
      const memberRef = doc(db, 'members', memberId);
      await deleteDoc(memberRef);
    } catch (error) {
      if (error instanceof ServiceErrorDepricated) {
        throw error;
      }
      console.error('Error deleting member:', error);
      throw new ServiceErrorDepricated('firestore/write-error', 'Failed to delete member');
    }
  }

  /**
   * Get member statistics from Firestore
   */
  static async getMemberStats(): Promise<{
    totalActive: number;
    totalInactive: number;
    wifiOptedIn: number;
    byFloor: Record<string, number>;
    totalOutstanding: number;
  }> {
    try {
      const allMembers = await this.getMembers();
      const activeMembers = allMembers.filter((m) => m.isActive);
      const inactiveMembers = allMembers.filter((m) => !m.isActive);

      const byFloor = activeMembers.reduce((acc, member) => {
        acc[member.floor] = (acc[member.floor] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalOutstanding = activeMembers
        .filter((m) => m.outstandingBalance > 0)
        .reduce((sum, m) => sum + m.outstandingBalance, 0);

      return {
        totalActive: activeMembers.length,
        totalInactive: inactiveMembers.length,
        wifiOptedIn: activeMembers.filter((m) => m.optedForWifi).length,
        byFloor,
        totalOutstanding,
      };
    } catch (error) {
      console.error('Error getting member stats:', error);
      throw new ServiceErrorDepricated('firestore/read-error', 'Failed to get member statistics');
    }
  }

  // Member Dashboard Specific Methods

  /**
   * Get member dashboard data by Firebase UID
   * Used for authenticated member dashboard access
   */
  static async getMemberByFirebaseUid(firebaseUid: string): Promise<Member | null> {
    try {
      const membersQuery = query(
        collection(db, 'members'),
        where('firebaseUid', '==', firebaseUid),
        where('isActive', '==', true),
        limit(1)
      );

      const snapshot = await getDocs(membersQuery);

      if (snapshot.empty) {
        return null;
      }

      const memberDoc = snapshot.docs[0];
      return {
        id: memberDoc.id,
        ...memberDoc.data(),
      } as Member;
    } catch (error) {
      console.error('Error fetching member by Firebase UID:', error);
      throw new ServiceErrorDepricated('firestore/read-error', 'Failed to fetch member by Firebase UID');
    }
  }

  /**
   * Get current month rent history for a member
   * Returns the most recent rent history entry
   */
  static async getMemberCurrentMonth(memberId: string): Promise<RentHistory | null> {
    try {
      const rentHistoryQuery = query(
        collection(db, 'members', memberId, 'rentHistory'),
        orderBy('generatedAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(rentHistoryQuery);

      if (snapshot.empty) {
        return null;
      }

      const historyDoc = snapshot.docs[0];
      return {
        id: historyDoc.id,
        ...historyDoc.data(),
      } as RentHistory;
    } catch (error) {
      console.error('Error fetching member current month:', error);
      throw new ServiceErrorDepricated('firestore/read-error', 'Failed to fetch current month data');
    }
  }

  /**
   * Get other active members (excluding the specified member)
   * Used for member dashboard friends directory
   */
  static async getOtherActiveMembers(excludeMemberId: string): Promise<
    Array<{
      id: string;
      name: string;
      phone: string;
      floor: string;
      bedType: string;
    }>
  > {
    try {
      const membersQuery = query(collection(db, 'members'), where('isActive', '==', true), orderBy('name'));

      const snapshot = await getDocs(membersQuery);
      const otherMembers: Array<{
        id: string;
        name: string;
        phone: string;
        floor: string;
        bedType: string;
      }> = [];

      snapshot.forEach((doc) => {
        // Exclude the current member from the friends list
        if (doc.id !== excludeMemberId) {
          const memberData = doc.data() as Member;
          otherMembers.push({
            id: doc.id,
            name: memberData.name,
            phone: memberData.phone,
            floor: memberData.floor,
            bedType: memberData.bedType,
          });
        }
      });

      return otherMembers;
    } catch (error) {
      console.error('Error fetching other active members:', error);
      throw new ServiceErrorDepricated('firestore/read-error', 'Failed to fetch other active members');
    }
  }

  /**
   * Update member's FCM token for push notifications
   */
  static async updateMemberFCMToken(memberId: string, fcmToken: string): Promise<void> {
    try {
      const memberRef = doc(db, 'members', memberId);
      await updateDoc(memberRef, {
        fcmToken: fcmToken,
      });
    } catch (error) {
      console.error('Error updating FCM token:', error);
      throw new ServiceErrorDepricated('firestore/write-error', 'Failed to update FCM token');
    }
  }

  /**
   * Link member account to Firebase UID
   * Used during account linking process
   */
  static async linkMemberToFirebaseUid(memberId: string, firebaseUid: string): Promise<Member> {
    try {
      // Check if Firebase UID is already linked to another member
      const existingMember = await this.getMemberByFirebaseUid(firebaseUid);
      if (existingMember && existingMember.id !== memberId) {
        throw new ServiceErrorDepricated(
          'business/uid-already-linked',
          'Firebase UID is already linked to another member'
        );
      }

      // Update member with Firebase UID
      const memberRef = doc(db, 'members', memberId);
      await updateDoc(memberRef, {
        firebaseUid: firebaseUid,
      });

      // Return updated member
      const updatedMember = await this.getMember(memberId);
      if (!updatedMember) {
        throw new ServiceErrorDepricated('business/member-not-found', 'Member not found after update');
      }

      return updatedMember;
    } catch (error) {
      if (error instanceof ServiceErrorDepricated) {
        throw error;
      }
      console.error('Error linking member to Firebase UID:', error);
      throw new ServiceErrorDepricated('firestore/write-error', 'Failed to link member account');
    }
  }

  /**
   * Get member dashboard data with error handling and retry mechanism
   * Combines member data and current month rent history
   */
  static async getMemberDashboardData(firebaseUid: string): Promise<{
    member: Member;
    currentMonth: RentHistory | null;
  }> {
    try {
      // Get member by Firebase UID
      const member = await this.getMemberByFirebaseUid(firebaseUid);
      if (!member) {
        throw new ServiceErrorDepricated('business/member-not-found', 'No active member found for this account');
      }

      // Get current month data
      const currentMonth = await this.getMemberCurrentMonth(member.id);

      return {
        member,
        currentMonth,
      };
    } catch (error) {
      if (error instanceof ServiceErrorDepricated) {
        throw error;
      }
      console.error('Error fetching member dashboard data:', error);
      throw new ServiceErrorDepricated('firestore/read-error', 'Failed to fetch member dashboard data');
    }
  }
}
