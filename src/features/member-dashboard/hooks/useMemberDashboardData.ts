/**
 * ❌ DEPRECATED: useMemberDashboardData Hook
 * 
 * This file has been replaced by:
 * - MemberDashboardContext.tsx (for enhanced context usage with performance monitoring)
 * - useMemberDashboard.simple.ts (for individual hook usage)
 * 
 * All content commented out - can be deleted after migration is complete.
 */

// import { useState, useCallback, useMemo, useEffect } from 'react';
// import { useAppContext } from '../../../contexts/AppContext';
// import type { Member, RentHistory } from '../../../shared/types/firestore-types';
// import type { MemberDashboardErrorState, MemberDashboardLoadingState } from '../../../contexts/hooks';
// import type { SimplifiedMember } from '../../../contexts/hooks/useMemberDashboard';

// export interface UseMemberDashboardData {
//   currentMember: Member | null;
//   currentMonthHistory: RentHistory | null;
//   otherMembers: SimplifiedMember[];
//   historyData: RentHistory[];
//   hasMoreHistory: boolean;
//   upi: any; // Contains vpa and payeeName
//   loading: MemberDashboardLoadingState;
//   errors: MemberDashboardErrorState;
//   actions: {
//     loadHistory: () => void;
//     loadMoreHistory: () => void;
//     loadFriendsData: () => Promise<void>;
//     refreshData: () => void;
//     retryFriendsData: () => Promise<void>;
//     retryHistory: () => Promise<void>;
//     retryDashboard: () => Promise<void>;
//   };
//   cache: {
//     memberLoaded: boolean;
//     friendsLoaded: boolean;
//     historyLoaded: boolean;
//   };
// }

// /**
//  * Custom hook for member dashboard data using AppContext with real-time updates
//  * Integrates with AppContext for centralized state management and Firebase Cloud Function calls
//  * Provides proper loading states, error handling, and retry mechanisms
//  */
// export const useMemberDashboardData = (): UseMemberDashboardData => {
//   // Get AppContext data and operations
//   const { memberDashboardOps } = useAppContext();

//   // Extract data constants (SAFE - these are reactive state values)
//   const memberDashboard = memberDashboardOps.dashboardData;
//   const loading = memberDashboardOps.loading;
//   const errors = memberDashboardOps.errors;

//   // Local state for cache flags and error handling
//   const [memberLoaded, setMemberLoaded] = useState(false);
//   const [friendsLoaded, setFriendsLoaded] = useState(false);
//   const [historyLoaded, setHistoryLoaded] = useState(false);

//   // Track when friends data is available or load on demand
//   const loadFriendsData = useCallback(
//     async (forceLoad = false) => {
//       console.log('Loading friends data...', forceLoad ? '(forced)' : '');

//       // Check for existing errors before attempting to load (skip if forced)
//       if (!forceLoad && errors.otherMembers) {
//         console.log(`Existing error found: ${errors.otherMembers}`);
//         return;
//       }

//       // Move guard checks inside function to avoid dependencies on changing state
//       if (memberDashboard.otherMembers.length > 0 && !friendsLoaded) {
//         console.log('Friends data already loaded.', friendsLoaded);
//         setFriendsLoaded(true);
//         return;
//       }

//       // If no friends data available and not currently loading, fetch it
//       if (memberDashboard.otherMembers.length === 0 && !loading.otherMembers && !friendsLoaded) {
//         await memberDashboardOps
//           .getOtherActiveMembers()
//           .then(() => {
//             console.log('Friends data loaded successfully.');
//             setFriendsLoaded(true);
//           })
//           .catch((error) => {
//             console.error('Failed to load friends data:', error);
//             setFriendsLoaded(false);
//           });
//       }
//     },
//     [memberDashboardOps, memberDashboard.otherMembers.length, loading.otherMembers, friendsLoaded, errors.otherMembers]
//   );

//   // Track when history data is available or load initial data
//   const loadHistory = useCallback(async () => {
//     // Move guard checks inside function to avoid dependencies on changing state
//     if (memberDashboardOps.dashboardData.rentHistory.length > 0 && !historyLoaded) {
//       setHistoryLoaded(true);
//       return;
//     }

//     // If no history data available and not currently loading, fetch initial batch
//     if (memberDashboard.rentHistory.length === 0 && !loading.history && !historyLoaded) {
//       try {
//         await memberDashboardOps.getMemberRentHistory(12);
//         setHistoryLoaded(true);
//       } catch (err) {
//         console.error('Failed to load history data:', err);
//       }
//     }
//   }, [memberDashboardOps, memberDashboard.rentHistory.length, loading.history, historyLoaded]);

//   // Load more history data with pagination
//   const loadMoreHistory = useCallback(async () => {
//     // Move guard checks inside function to avoid dependencies on changing state
//     if (loading.history || !memberDashboard.hasMoreHistory || !memberDashboard.nextHistoryCursor) {
//       return;
//     }

//     try {
//       await memberDashboardOps.getMemberRentHistory(12, memberDashboard.nextHistoryCursor);
//     } catch (err) {
//       console.error('Failed to load more history:', err);
//     }
//   }, [memberDashboardOps, loading.history, memberDashboard.hasMoreHistory, memberDashboard.nextHistoryCursor]);

//   // Wrapper for loadHistory to handle async properly (for UI button clicks)
//   const handleLoadHistory = useCallback(() => {
//     void loadHistory();
//   }, [loadHistory]);

//   // Wrapper for loadMoreHistory to handle async properly (for UI button clicks)
//   const handleLoadMoreHistory = useCallback(() => {
//     void loadMoreHistory();
//   }, [loadMoreHistory]);

//   // Note: Friends and history data are loaded on-demand via user interactions
//   // - Friends: Loaded ONLY when user clicks on "Friends" tab (not automatically)
//   // - History: Loaded when user clicks "Load History" button
//   // - More History: Loaded when user clicks "Load More" button

//   // Refresh all data - clears cache and reloads everything (requirement 7.4)
//   const refreshData = useCallback(async () => {
//     setMemberLoaded(false);
//     setFriendsLoaded(false);
//     setHistoryLoaded(false);

//     // Force refresh member dashboard data with current function reference
//     try {
//       await memberDashboardOps.getMemberDashboard();
//       setMemberLoaded(true);
//     } catch (err) {
//       console.error('Failed to refresh member data:', err);
//     }
//   }, [memberDashboardOps]);

//   // ... existing code

//   // Retry functions that clear errors and reload
//   const retryFriendsData = useCallback(async () => {
//     console.log('Retry button clicked - clearing error and retrying...');

//     // Clear the error state first
//     memberDashboardOps.clearError('otherMembers');

//     // Reset cache to force reload
//     setFriendsLoaded(false);

//     // Retry loading friends data with force flag
//     await loadFriendsData(true);
//   }, [loadFriendsData, memberDashboardOps]);

//   const retryHistory = useCallback(async () => {
//     setHistoryLoaded(false); // Reset cache to force reload
//     await loadHistory();
//   }, [loadHistory]);

//   const retryDashboard = useCallback(async () => {
//     setMemberLoaded(false); // Reset cache to force reload
//     await memberDashboardOps.getMemberDashboard();
//     setMemberLoaded(true);
//   }, [memberDashboardOps]);

//   // Combine errors from AppContext and local errors (requirement 7.5)
//   //   const combinedError = localError || errors.dashboard || errors.history || errors.otherMembers;

//   // Process history data to exclude current month (requirement 5.2)
//   const processedHistoryData = useMemo(() => {
//     if (!memberDashboard.rentHistory.length) return [];

//     // If the history includes current month, exclude it from the display
//     const currentMonthId = memberDashboard.currentMonth?.id;
//     const historyArray = memberDashboard.rentHistory;

//     // Filter out current month if it exists in history
//     return historyArray.filter((history) => history.id !== currentMonthId);
//   }, [memberDashboard.rentHistory, memberDashboard.currentMonth?.id]);

//   // Use admin's UPI data for payment collection (members pay TO admin)
//   const memberUpiData = useMemo(() => {
//     // Use the UPI data already provided by the cloud function
//     // This contains the admin's VPA and payee name from global settings
//     if (!memberDashboard.upi?.upiVpa) {
//       return null;
//     }

//     return {
//       vpa: memberDashboard.upi.upiVpa, // Admin's UPI VPA (where members send payment)
//       payeeName: memberDashboard.upi.payeeName, // Admin's name (who receives payment)
//     };
//   }, [memberDashboard.upi]);

//   return {
//     currentMember: memberDashboard.member,
//     currentMonthHistory: memberDashboard.currentMonth,
//     otherMembers: memberDashboard.otherMembers,
//     historyData: processedHistoryData,
//     hasMoreHistory: memberDashboard.hasMoreHistory,
//     upi: memberUpiData,
//     loading,
//     errors,
//     actions: {
//       loadHistory: handleLoadHistory, // Button click: "Load History"
//       loadMoreHistory: handleLoadMoreHistory, // Button click: "Load More"
//       loadFriendsData, // Tab click: "Friends" tab
//       refreshData, // Button click: "Refresh" button
//       // Retry functions for error handling
//       retryFriendsData,
//       retryHistory,
//       retryDashboard,
//     },
//     cache: {
//       memberLoaded,
//       friendsLoaded,
//       historyLoaded,
//     },
//   };
// };
