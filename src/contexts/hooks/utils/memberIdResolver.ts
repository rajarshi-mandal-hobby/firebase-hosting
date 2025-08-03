/**
 * Dynamic Member ID Resolution Utility
 *
 * Handles determining the current member ID based on:
 * - User authentication (Firebase Auth)
 * - Admin selection (for admin viewing member data)
 * - Default testing member
 */

import { auth } from '../../../../firebase';

export interface MemberIdContext {
  userType: 'member' | 'admin';
  memberId?: string; // For admin viewing specific member
  currentUser?: {
    email: string;
    linkedMemberId?: string;
  };
}

/**
 * Get the current member ID based on context
 */
export function getCurrentMemberId(context: MemberIdContext): string {
  const { userType, memberId, currentUser } = context;

  // For admin viewing specific member
  if (userType === 'admin' && memberId) {
    return memberId;
  }

  // For member accessing their own dashboard
  if (userType === 'member') {
    // Check if Firebase user is authenticated
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      // Use Firebase user UID as member ID
      // The Firebase Functions will handle the mapping from UID to member data
      return firebaseUser.uid;
    }

    // When auth is implemented, use authenticated user's linked member ID
    if (currentUser?.linkedMemberId) {
      return currentUser.linkedMemberId;
    }
  }

  // Fallback to member-1 for testing without auth
  return 'member-1';
}

/**
 * Hook to get current member ID with context awareness
 * For member dashboard, this will be null/undefined (uses authenticated user)
 * For admin viewing specific member, pass the memberId
 */
export function useCurrentMemberId(userType: 'member' | 'admin', memberId?: string): string | undefined {
  // For member dashboard, don't pass memberId - let Firebase Functions determine from auth
  if (userType === 'member') {
    return undefined; // Firebase Functions will use the authenticated user's UID
  }

  // For admin viewing specific member
  if (userType === 'admin' && memberId) {
    return memberId;
  }

  // Fallback for testing
  return getCurrentMemberId({
    userType,
    memberId,
  });
}
