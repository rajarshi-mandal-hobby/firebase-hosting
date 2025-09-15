// /**
//  * AppContext - Global state management for members, settings, and operations.
//  */

// import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
// import { RealtimeService } from './services';
// import { notifications } from '@mantine/notifications';
// import type {
//   Member,
//   GlobalSettings,
//   AddMemberFormData,
//   EditMemberFormData,
//   SettlementPreview,
// } from '../shared/types/firestore-types';
// import { useMemberOperations } from './hooks/useMemberOperations';
// import { useBillingOperations } from './hooks/useBillingOperations';
// import { useAdminOperations } from './hooks/useAdminOperations';
// import { useAuth } from './useAuth';
// import { usePaymentSettings } from './hooks/usePaymentSettings';

// interface AppContextType {
//   activeMembers: Member[];
//   globalSettings: GlobalSettings | null;
//   retryConnection: () => void;
//   memberOperations: ReturnType<typeof useMemberOperations>;
//   billingOperations: ReturnType<typeof useBillingOperations>;
//   adminOperations: ReturnType<typeof useAdminOperations>;
//   auth: ReturnType<typeof useAuth>;
//   paymentSettings: ReturnType<typeof usePaymentSettings>;
//   addMember: (memberData: AddMemberFormData) => Promise<void>;
//   updateMember: (memberId: string, updates: EditMemberFormData) => Promise<void>;
//   deactivateMember: (memberId: string, leaveDate: Date) => Promise<SettlementPreview>;
//   deleteMember: (memberId: string) => Promise<void>;
//   getMemberStats: () => {
//     totalActive: number;
//     wifiOptedIn: number;
//     byFloor: Record<string, number>;
//   };
//   fetchInactiveMembers: () => Promise<Member[]>;
//   searchMembers: (query: string, members?: Member[]) => Member[];
//   filterMembers: (
//     members: Member[],
//     filters: {
//       floor?: string;
//       accountStatus?: 'linked' | 'unlinked' | 'all';
//     }
//   ) => Member[];
// }

// // Create Context
// const AppContext = createContext<AppContextType | null>(null);

// interface AppProviderProps {
//   children: ReactNode;
// }

// export function AppProvider({ children }: AppProviderProps) {
//   const [activeMembers, setActiveMembers] = useState<Member[]>([]);
//   const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
//   const [retryCount, setRetryCount] = useState({
//     members: 0,
//     settings: 0,
//   });

//   const memberOperations = useMemberOperations();
//   const billingOperations = useBillingOperations();
//   const adminOperations = useAdminOperations();
//   const auth = useAuth();
//   const paymentSettings = usePaymentSettings();

//   const retryConnection = useCallback(() => {
//     // Reset retry counters to trigger re-subscription
//     setRetryCount({ members: 0, settings: 0 });
//   }, []);

//   useEffect(() => {
//     let membersUnsubscribe: (() => void) | null = null;
//     let settingsUnsubscribe: (() => void) | null = null;

//     const setupMembersSubscription = () => {
//       try {
//         membersUnsubscribe = RealtimeService.subscribeToActiveMembers((members: Member[]) => {
//           setActiveMembers(members);
//           setRetryCount((prev) => ({ ...prev, members: 0 }));
//         });
//       } catch (error: any) {
//         console.error('Failed to setup members subscription:', error);
//         notifications.show({
//           title: 'Connection Error',
//           message: 'Unable to load member data. Please check your connection.',
//           color: 'red',
//           position: 'bottom-center',
//           autoClose: false,
//         });
//         const currentRetryCount = retryCount.members;
//         if (currentRetryCount < 3) {
//           const retryDelay = Math.pow(2, currentRetryCount) * 1000;
//           setTimeout(() => {
//             setRetryCount((prev) => ({ ...prev, members: prev.members + 1 }));
//             setupMembersSubscription();
//           }, retryDelay);
//         }
//       }
//     };

//     const setupSettingsSubscription = () => {
//       try {
//         settingsUnsubscribe = RealtimeService.subscribeToGlobalSettings((settings: GlobalSettings) => {
//           setGlobalSettings(settings);
//           setRetryCount((prev) => ({ ...prev, settings: 0 }));
//         });
//       } catch (error: any) {
//         console.error('Failed to setup settings subscription:', error);
//         notifications.show({
//           title: 'Settings Error',
//           message: 'Unable to load application settings. Some features may not work correctly.',
//           color: 'orange',
//           position: 'bottom-center',
//           autoClose: false,
//         });
//         const currentRetryCount = retryCount.settings;
//         if (currentRetryCount < 3) {
//           const retryDelay = Math.pow(2, currentRetryCount) * 1000;
//           setTimeout(() => {
//             setRetryCount((prev) => ({ ...prev, settings: prev.settings + 1 }));
//             setupSettingsSubscription();
//           }, retryDelay);
//         }
//       }
//     };

//     setupMembersSubscription();
//     setupSettingsSubscription();

//     return () => {
//       if (membersUnsubscribe) membersUnsubscribe();
//       if (settingsUnsubscribe) settingsUnsubscribe();
//     };
//   }, [retryCount.members, retryCount.settings]);

//   const addMember = useCallback(
//     async (memberData: AddMemberFormData): Promise<void> => {
//       await memberOperations.addMember(memberData);
//     },
//     [memberOperations]
//   );

//   const updateMember = useCallback(
//     async (memberId: string, updates: EditMemberFormData): Promise<void> => {
//       await memberOperations.updateMember(memberId, updates);
//     },
//     [memberOperations]
//   );

//   const deactivateMember = useCallback(
//     async (memberId: string, leaveDate: Date): Promise<SettlementPreview> => {
//       return await memberOperations.deactivateMember(memberId, leaveDate);
//     },
//     [memberOperations]
//   );

//   const deleteMember = useCallback(
//     async (memberId: string): Promise<void> => {
//       await memberOperations.deleteMember(memberId);
//     },
//     [memberOperations]
//   );

//   const getMemberStats = useCallback(() => {
//     const stats = {
//       totalActive: activeMembers.length,
//       wifiOptedIn: activeMembers.filter((m) => m.optedForWifi).length,
//       byFloor: {} as Record<string, number>,
//     };
//     activeMembers.forEach((member) => {
//       stats.byFloor[member.floor] = (stats.byFloor[member.floor] || 0) + 1;
//     });
//     return stats;
//   }, [activeMembers]);

//   const fetchInactiveMembers = useCallback(async (): Promise<Member[]> => {
//     return await memberOperations.fetchInactiveMembers();
//   }, [memberOperations]);

//   const searchMembers = useCallback(
//     (query: string, members: Member[] = activeMembers): Member[] => {
//       if (!query.trim()) return members;
//       const searchTerm = query.toLowerCase().trim();
//       return members.filter(
//         (member) => member.name.toLowerCase().includes(searchTerm) || member.phone.includes(searchTerm)
//       );
//     },
//     [activeMembers]
//   );

//   const filterMembers = useCallback(
//     (
//       members: Member[],
//       filters: {
//         floor?: string;
//         accountStatus?: 'linked' | 'unlinked' | 'all';
//       }
//     ): Member[] => {
//       let filtered = [...members];

//       if (filters.floor && filters.floor !== 'all') {
//         filtered = filtered.filter((member) => member.floor === filters.floor);
//       }

//       if (filters.accountStatus && filters.accountStatus !== 'all') {
//         if (filters.accountStatus === 'linked') {
//           filtered = filtered.filter((member) => !!member.firebaseUid);
//         } else if (filters.accountStatus === 'unlinked') {
//           filtered = filtered.filter((member) => !member.firebaseUid);
//         }
//       }

//       return filtered;
//     },
//     []
//   );

//   const contextValue = useMemo<AppContextType>(
//     () => ({
//       activeMembers,
//       globalSettings,
//       retryConnection,
//       memberOperations,
//       billingOperations,
//       adminOperations,
//       auth,
//       paymentSettings,
//       addMember,
//       updateMember,
//       deactivateMember,
//       deleteMember,
//       getMemberStats,
//       fetchInactiveMembers,
//       searchMembers,
//       filterMembers,
//     }),
//     [
//       activeMembers,
//       globalSettings,
//       retryConnection,
//       memberOperations,
//       billingOperations,
//       adminOperations,
//       auth,
//       paymentSettings,
//       addMember,
//       updateMember,
//       deactivateMember,
//       deleteMember,
//       getMemberStats,
//       fetchInactiveMembers,
//       searchMembers,
//       filterMembers,
//     ]
//   );

//   return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
// }

// // Custom Hook
// export function useAppContext(): AppContextType {
//   const context = useContext(AppContext);
//   if (!context) {
//     throw new Error('useAppContext must be used within an AppProvider');
//   }
//   return context;
// }

// // Set displayName for debugging
// AppProvider.displayName = 'AppProvider';
// useAppContext.displayName = 'useAppContext';

// // Export context for direct access if needed
// export { AppContext };
