/**
 * AppContext - Simple React Context for global state management
 *
 * This context provides:
 * - Real-time member data via Firestore onSnapshot
 * - Global settings with real-time updates
 * - Member operations (add, update, deactivate, delete)
 * - Simple loading states without caching overhead
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { FirestoreService } from '../data/firestoreService';
import { notifications } from '@mantine/notifications';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type {
  Member,
  GlobalSettings,
  AddMemberFormData,
  EditMemberFormData,
  SettlementPreview,
  RentHistory,
} from '../shared/types/firestore-types';

// Context Type Definition
interface AppContextType {
  // Data State
  activeMembers: Member[];
  globalSettings: GlobalSettings | null;

  // Member Dashboard State
  memberDashboard: {
    member: Member | null;
    currentMonth: RentHistory | null;
    rentHistory: RentHistory[];
    hasMoreHistory: boolean;
    nextHistoryCursor?: string;
    otherMembers: Array<{
      id: string;
      name: string;
      phone: string;
      floor: string;
      bedType: string;
    }>;
  };

  // Loading States
  loading: {
    members: boolean;
    settings: boolean;
    operations: boolean;
    memberDashboard: boolean;
    memberHistory: boolean;
    otherMembers: boolean;
  };

  // Error States
  errors: {
    members: string | null;
    settings: string | null;
    connection: string | null;
    memberDashboard: string | null;
    memberHistory: string | null;
    otherMembers: string | null;
  };

  // Connection retry
  retryConnection: () => void;

  // Member Operations
  addMember: (memberData: AddMemberFormData) => Promise<void>;
  updateMember: (memberId: string, updates: EditMemberFormData) => Promise<void>;
  deactivateMember: (memberId: string, leaveDate: Date) => Promise<SettlementPreview>;
  deleteMember: (memberId: string) => Promise<void>;

  // Member Dashboard Operations
  getMemberDashboard: () => Promise<void>;
  getMemberRentHistory: (limit?: number, startAfter?: string) => Promise<void>;
  getOtherActiveMembers: () => Promise<void>;
  updateFCMToken: (fcmToken: string) => Promise<void>;
  linkMemberAccount: (phoneNumber: string) => Promise<Member>;
  setupMemberDashboardListeners: (memberId: string) => () => void;

  // Utility Functions
  getMemberStats: () => {
    totalActive: number;
    wifiOptedIn: number;
    byFloor: Record<string, number>;
  };
  fetchInactiveMembers: () => Promise<Member[]>;

  // Search and Filter
  searchMembers: (query: string, members?: Member[]) => Member[];
  filterMembers: (
    members: Member[],
    filters: {
      floor?: string;
      accountStatus?: 'linked' | 'unlinked' | 'all';
    }
  ) => Member[];
}

// Create Context
const AppContext = createContext<AppContextType | null>(null);

// Provider Props
interface AppProviderProps {
  children: ReactNode;
}

// Provider Component
export function AppProvider({ children }: AppProviderProps) {
  // State
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);

  // Member Dashboard State
  const [memberDashboard, setMemberDashboard] = useState({
    member: null as Member | null,
    currentMonth: null as RentHistory | null,
    rentHistory: [] as RentHistory[],
    hasMoreHistory: false,
    nextHistoryCursor: undefined as string | undefined,
    otherMembers: [] as Array<{
      id: string;
      name: string;
      phone: string;
      floor: string;
      bedType: string;
    }>,
  });

  const [loading, setLoading] = useState({
    members: true,
    settings: true,
    operations: false,
    memberDashboard: false,
    memberHistory: false,
    otherMembers: false,
  });
  const [errors, setErrors] = useState({
    members: null as string | null,
    settings: null as string | null,
    connection: null as string | null,
    memberDashboard: null as string | null,
    memberHistory: null as string | null,
    otherMembers: null as string | null,
  });
  const [retryCount, setRetryCount] = useState({
    members: 0,
    settings: 0,
  });

  // Connection retry function
  const retryConnection = useCallback(() => {
    setLoading({
      members: true,
      settings: true,
      operations: false,
      memberDashboard: false,
      memberHistory: false,
      otherMembers: false,
    });
    setErrors({
      members: null,
      settings: null,
      connection: null,
      memberDashboard: null,
      memberHistory: null,
      otherMembers: null,
    });
    setRetryCount({
      members: 0,
      settings: 0,
    });
  }, []);

  // Real-time Firestore Listeners with Error Handling
  useEffect(() => {
    let membersUnsubscribe: (() => void) | null = null;
    let settingsUnsubscribe: (() => void) | null = null;

    // Setup members subscription with error handling
    const setupMembersSubscription = () => {
      try {
        membersUnsubscribe = FirestoreService.Realtime.subscribeToActiveMembers((members) => {
          setActiveMembers(members);
          setLoading((prev) => ({ ...prev, members: false }));
          setErrors((prev) => ({ ...prev, members: null, connection: null }));
          setRetryCount((prev) => ({ ...prev, members: 0 }));
        });
      } catch (error: any) {
        console.error('Failed to setup members subscription:', error);
        const errorMessage = error?.message || 'Failed to connect to member data';

        setErrors((prev) => ({
          ...prev,
          members: errorMessage,
          connection: 'Database connection failed. Please check your internet connection.',
        }));
        setLoading((prev) => ({ ...prev, members: false }));

        // Show user notification for connection issues
        notifications.show({
          title: 'Connection Error',
          message: 'Unable to load member data. Please check your connection.',
          color: 'red',
          autoClose: false,
        });

        // Implement exponential backoff retry
        const currentRetryCount = retryCount.members;
        if (currentRetryCount < 3) {
          const retryDelay = Math.pow(2, currentRetryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            setRetryCount((prev) => ({ ...prev, members: prev.members + 1 }));
            setupMembersSubscription();
          }, retryDelay);
        }
      }
    };

    // Setup settings subscription with error handling
    const setupSettingsSubscription = () => {
      try {
        settingsUnsubscribe = FirestoreService.Realtime.subscribeToGlobalSettings((settings) => {
          setGlobalSettings(settings);
          setLoading((prev) => ({ ...prev, settings: false }));
          setErrors((prev) => ({ ...prev, settings: null }));
          setRetryCount((prev) => ({ ...prev, settings: 0 }));
        });
      } catch (error: any) {
        console.error('Failed to setup settings subscription:', error);
        const errorMessage = error?.message || 'Failed to connect to settings data';

        setErrors((prev) => ({
          ...prev,
          settings: errorMessage,
          connection: 'Database connection failed. Please check your internet connection.',
        }));
        setLoading((prev) => ({ ...prev, settings: false }));

        // Show user notification for connection issues
        notifications.show({
          title: 'Settings Error',
          message: 'Unable to load application settings. Some features may not work correctly.',
          color: 'orange',
          autoClose: false,
        });

        // Implement exponential backoff retry
        const currentRetryCount = retryCount.settings;
        if (currentRetryCount < 3) {
          const retryDelay = Math.pow(2, currentRetryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            setRetryCount((prev) => ({ ...prev, settings: prev.settings + 1 }));
            setupSettingsSubscription();
          }, retryDelay);
        }
      }
    };

    // Initialize subscriptions
    setupMembersSubscription();
    setupSettingsSubscription();

    // Cleanup subscriptions
    return () => {
      if (membersUnsubscribe) {
        membersUnsubscribe();
      }
      if (settingsUnsubscribe) {
        settingsUnsubscribe();
      }
    };
  }, [retryCount.members, retryCount.settings]);

  // Member Dashboard Real-time Listeners
  const setupMemberDashboardListeners = useCallback((memberId: string) => {
    let memberHistoryUnsubscribe: (() => void) | null = null;

    try {
      // Subscribe to member's rent history for real-time updates
      memberHistoryUnsubscribe = FirestoreService.Realtime.subscribeToMemberRentHistory(memberId, (rentHistory) => {
        setMemberDashboard((prev) => ({
          ...prev,
          rentHistory: rentHistory.slice(1, 13), // Exclude current month, limit to 12 months
          currentMonth: rentHistory.length > 0 ? rentHistory[0] : null, // Most recent is current month
        }));
        setLoading((prev) => ({ ...prev, memberHistory: false }));
        setErrors((prev) => ({ ...prev, memberHistory: null }));
      });
    } catch (error: any) {
      console.error('Failed to setup member dashboard listeners:', error);
      setErrors((prev) => ({
        ...prev,
        memberHistory: 'Failed to connect to rent history data',
      }));
    }

    // Return cleanup function
    return () => {
      if (memberHistoryUnsubscribe) {
        memberHistoryUnsubscribe();
      }
    };
  }, []);

  // Member Operations
  const addMember = useCallback(async (memberData: AddMemberFormData): Promise<void> => {
    setLoading((prev) => ({ ...prev, operations: true }));

    try {
      await FirestoreService.Members.addMember({
        name: memberData.name,
        phone: memberData.phone,
        floor: memberData.floor,
        bedType: memberData.bedType,
        rentAmount: memberData.rentAtJoining,
        securityDeposit: memberData.securityDeposit,
        advanceDeposit: memberData.advanceDeposit,
        optedForWifi: memberData.fullPayment, // Assuming fullPayment maps to WiFi for now
        moveInDate: memberData.moveInDate,
      });

      notifications.show({
        title: 'Success',
        message: `Member ${memberData.name} added successfully`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error adding member:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to add member. Please try again.',
        color: 'red',
      });
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, operations: false }));
    }
  }, []);

  const updateMember = useCallback(async (memberId: string, updates: EditMemberFormData): Promise<void> => {
    setLoading((prev) => ({ ...prev, operations: true }));

    try {
      await FirestoreService.Members.updateMember(memberId, {
        floor: updates.floor,
        bedType: updates.bedType,
        currentRent: updates.currentRent,
      });

      notifications.show({
        title: 'Success',
        message: 'Member updated successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating member:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update member. Please try again.',
        color: 'red',
      });
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, operations: false }));
    }
  }, []);

  const deactivateMember = useCallback(async (memberId: string, leaveDate: Date): Promise<SettlementPreview> => {
    setLoading((prev) => ({ ...prev, operations: true }));

    try {
      // Call the Cloud Function for member deactivation
      const functions = getFunctions();
      const deactivateMemberFn = httpsCallable(functions, 'deactivateMember');

      const result = await deactivateMemberFn({
        memberId,
        leaveDate: leaveDate.toISOString(),
      });

      const response = result.data as {
        success: boolean;
        message: string;
        data: {
          settlement: {
            memberName: string;
            totalAgreedDeposit: number;
            outstandingBalance: number;
            refundAmount: number;
            status: 'Refund Due' | 'Payment Due' | 'Settled';
            leaveDate: string;
          };
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to deactivate member');
      }

      notifications.show({
        title: 'Success',
        message: 'Member deactivated successfully',
        color: 'green',
      });

      // Return settlement preview from Cloud Function response
      return response.data.settlement;
    } catch (error) {
      console.error('Error deactivating member:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to deactivate member. Please try again.',
        color: 'red',
      });
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, operations: false }));
    }
  }, []);

  const deleteMember = useCallback(async (memberId: string): Promise<void> => {
    setLoading((prev) => ({ ...prev, operations: true }));

    try {
      await FirestoreService.Members.deleteMember(memberId);

      notifications.show({
        title: 'Success',
        message: 'Member deleted permanently',
        color: 'green',
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete member. Please try again.',
        color: 'red',
      });
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, operations: false }));
    }
  }, []);

  // Member Dashboard Operations
  const getMemberDashboard = useCallback(async (): Promise<void> => {
    setLoading((prev) => ({ ...prev, memberDashboard: true }));
    setErrors((prev) => ({ ...prev, memberDashboard: null }));

    try {
      const functions = getFunctions();
      const getMemberDashboardFn = httpsCallable(functions, 'getMemberDashboard');

      const result = await getMemberDashboardFn();
      const response = result.data as {
        success: boolean;
        message: string;
        data: {
          member: Member;
          currentMonth?: RentHistory;
          globalSettings: {
            upiVpa?: string;
            payeeName?: string;
          };
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch member dashboard');
      }

      setMemberDashboard((prev) => ({
        ...prev,
        member: response.data.member,
        currentMonth: response.data.currentMonth || null,
      }));
    } catch (error: any) {
      console.error('Error fetching member dashboard:', error);
      const errorMessage = error?.message || 'Failed to load dashboard data';
      setErrors((prev) => ({ ...prev, memberDashboard: errorMessage }));

      notifications.show({
        title: 'Error',
        message: 'Failed to load dashboard data. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading((prev) => ({ ...prev, memberDashboard: false }));
    }
  }, []);

  const getMemberRentHistory = useCallback(async (limit: number = 12, startAfter?: string): Promise<void> => {
    setLoading((prev) => ({ ...prev, memberHistory: true }));
    setErrors((prev) => ({ ...prev, memberHistory: null }));

    try {
      const functions = getFunctions();
      const getMyRentHistoryFn = httpsCallable(functions, 'getMyRentHistory');

      const result = await getMyRentHistoryFn({
        limit,
        startAfter,
      });

      const response = result.data as {
        success: boolean;
        message: string;
        data: {
          rentHistory: RentHistory[];
          hasMore: boolean;
          nextCursor?: string;
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch rent history');
      }

      setMemberDashboard((prev) => ({
        ...prev,
        rentHistory: startAfter ? [...prev.rentHistory, ...response.data.rentHistory] : response.data.rentHistory,
        hasMoreHistory: response.data.hasMore,
        nextHistoryCursor: response.data.nextCursor,
      }));
    } catch (error: any) {
      console.error('Error fetching rent history:', error);
      const errorMessage = error?.message || 'Failed to load rent history';
      setErrors((prev) => ({ ...prev, memberHistory: errorMessage }));

      notifications.show({
        title: 'Error',
        message: 'Failed to load rent history. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading((prev) => ({ ...prev, memberHistory: false }));
    }
  }, []);

  const getOtherActiveMembers = useCallback(async (): Promise<void> => {
    setLoading((prev) => ({ ...prev, otherMembers: true }));
    setErrors((prev) => ({ ...prev, otherMembers: null }));

    try {
      const functions = getFunctions();
      const getOtherActiveMembersFn = httpsCallable(functions, 'getOtherActiveMembers');

      const result = await getOtherActiveMembersFn();
      const response = result.data as {
        success: boolean;
        message: string;
        data: {
          members: Array<{
            id: string;
            name: string;
            phone: string;
            floor: string;
            bedType: string;
          }>;
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch other members');
      }

      setMemberDashboard((prev) => ({
        ...prev,
        otherMembers: response.data.members,
      }));
    } catch (error: any) {
      console.error('Error fetching other members:', error);
      const errorMessage = error?.message || 'Failed to load friends list';
      setErrors((prev) => ({ ...prev, otherMembers: errorMessage }));

      notifications.show({
        title: 'Error',
        message: 'Failed to load friends list. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading((prev) => ({ ...prev, otherMembers: false }));
    }
  }, []);

  const updateFCMToken = useCallback(async (fcmToken: string): Promise<void> => {
    try {
      const functions = getFunctions();
      const updateFCMTokenFn = httpsCallable(functions, 'updateFCMToken');

      const result = await updateFCMTokenFn({ fcmToken });
      const response = result.data as {
        success: boolean;
        message: string;
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to update FCM token');
      }

      notifications.show({
        title: 'Success',
        message: 'Notification settings updated',
        color: 'green',
      });
    } catch (error: any) {
      console.error('Error updating FCM token:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update notification settings.',
        color: 'red',
      });
      throw error;
    }
  }, []);

  const linkMemberAccount = useCallback(async (phoneNumber: string): Promise<Member> => {
    try {
      const functions = getFunctions();
      const linkMemberAccountFn = httpsCallable(functions, 'linkMemberAccount');

      const result = await linkMemberAccountFn({ phoneNumber });
      const response = result.data as {
        success: boolean;
        message: string;
        data: {
          success: boolean;
          member: Member;
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to link member account');
      }

      notifications.show({
        title: 'Success',
        message: 'Account linked successfully',
        color: 'green',
      });

      return response.data.member;
    } catch (error: any) {
      console.error('Error linking member account:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to link account. Please check your phone number.',
        color: 'red',
      });
      throw error;
    }
  }, []);

  // Utility Functions
  const getMemberStats = useCallback(() => {
    const stats = {
      totalActive: activeMembers.length,
      wifiOptedIn: activeMembers.filter((m) => m.optedForWifi).length,
      byFloor: {} as Record<string, number>,
    };

    // Calculate by floor
    activeMembers.forEach((member) => {
      stats.byFloor[member.floor] = (stats.byFloor[member.floor] || 0) + 1;
    });

    return stats;
  }, [activeMembers]);

  const fetchInactiveMembers = useCallback(async (): Promise<Member[]> => {
    try {
      return await FirestoreService.Members.getMembers({ isActive: false });
    } catch (error) {
      console.error('Error fetching inactive members:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch inactive members',
        color: 'red',
      });
      return [];
    }
  }, []);

  // Search and Filter Functions
  const searchMembers = useCallback(
    (query: string, members: Member[] = activeMembers): Member[] => {
      if (!query.trim()) return members;

      const searchTerm = query.toLowerCase().trim();
      return members.filter(
        (member) => member.name.toLowerCase().includes(searchTerm) || member.phone.includes(searchTerm)
      );
    },
    [activeMembers]
  );

  const filterMembers = useCallback(
    (
      members: Member[],
      filters: {
        floor?: string;
        accountStatus?: 'linked' | 'unlinked' | 'all';
      }
    ): Member[] => {
      let filtered = [...members];

      // Filter by floor
      if (filters.floor && filters.floor !== 'all') {
        filtered = filtered.filter((member) => member.floor === filters.floor);
      }

      // Filter by account status
      if (filters.accountStatus && filters.accountStatus !== 'all') {
        if (filters.accountStatus === 'linked') {
          filtered = filtered.filter((member) => !!member.firebaseUid);
        } else if (filters.accountStatus === 'unlinked') {
          filtered = filtered.filter((member) => !member.firebaseUid);
        }
      }

      return filtered;
    },
    []
  );

  // Context Value
  const contextValue: AppContextType = {
    // Data State
    activeMembers,
    globalSettings,

    // Member Dashboard State
    memberDashboard,

    // Loading States
    loading,

    // Error States
    errors,

    // Connection retry
    retryConnection,

    // Member Operations
    addMember,
    updateMember,
    deactivateMember,
    deleteMember,

    // Member Dashboard Operations
    getMemberDashboard,
    getMemberRentHistory,
    getOtherActiveMembers,
    updateFCMToken,
    linkMemberAccount,
    setupMemberDashboardListeners,

    // Utility Functions
    getMemberStats,
    fetchInactiveMembers,

    // Search and Filter
    searchMembers,
    filterMembers,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// Custom Hook
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Export context for direct access if needed
export { AppContext };
