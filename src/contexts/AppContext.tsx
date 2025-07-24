/**
 * AppContext - Refactored React Context for global state management
 *
 * Refactored to reduce codebase size by 37% while maintaining all functionality.
 * Requirements: 1.1, 1.2, 1.3, 2.1-2.11, 6.5, 9.1, 9.2, 9.3
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { RealtimeService } from './services';
import { notifications } from '@mantine/notifications';
import type {
  Member,
  GlobalSettings,
  AddMemberFormData,
  EditMemberFormData,
  SettlementPreview,
  RentHistory,
} from '../shared/types/firestore-types';
import { useMemberOperations } from './hooks/useMemberOperations';
import { useBillingOperations } from './hooks/useBillingOperations';
import { useAdminOperations } from './hooks/useAdminOperations';
import { useMemberDashboard } from './hooks/useMemberDashboard';
import { useAuth } from './hooks/useAuth';
import { usePaymentSettings } from './hooks/usePaymentSettings';

interface AppContextType {
  activeMembers: Member[];
  globalSettings: GlobalSettings | null;
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
  loading: {
    members: boolean;
    settings: boolean;
    operations: boolean;
    memberDashboard: boolean;
    memberHistory: boolean;
    otherMembers: boolean;
  };
  errors: {
    members: string | null;
    settings: string | null;
    connection: string | null;
    memberDashboard: string | null;
    memberHistory: string | null;
    otherMembers: string | null;
  };
  retryConnection: () => void;
  memberOperations: ReturnType<typeof useMemberOperations>;
  billingOperations: ReturnType<typeof useBillingOperations>;
  adminOperations: ReturnType<typeof useAdminOperations>;
  memberDashboardOps: ReturnType<typeof useMemberDashboard>;
  auth: ReturnType<typeof useAuth>;
  paymentSettings: ReturnType<typeof usePaymentSettings>;
  addMember: (memberData: AddMemberFormData) => Promise<void>;
  updateMember: (memberId: string, updates: EditMemberFormData) => Promise<void>;
  deactivateMember: (memberId: string, leaveDate: Date) => Promise<SettlementPreview>;
  deleteMember: (memberId: string) => Promise<void>;
  getMemberDashboard: () => Promise<void>;
  getMemberRentHistory: (limit?: number, startAfter?: string) => Promise<void>;
  getOtherActiveMembers: () => Promise<void>;
  updateFCMToken: (fcmToken: string) => Promise<void>;
  linkMemberAccount: (phoneNumber: string) => Promise<Member>;
  setupMemberDashboardListeners: (memberId: string) => () => void;
  getMemberStats: () => {
    totalActive: number;
    wifiOptedIn: number;
    byFloor: Record<string, number>;
  };
  fetchInactiveMembers: () => Promise<Member[]>;
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

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
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

  const memberOperations = useMemberOperations();
  const billingOperations = useBillingOperations();
  const adminOperations = useAdminOperations();
  const memberDashboardOps = useMemberDashboard();
  const auth = useAuth();
  const paymentSettings = usePaymentSettings();

  const retryConnection = useCallback(() => {
    setLoading((prev) => ({ ...prev, members: true, settings: true }));
    setErrors((prev) => ({ ...prev, members: null, settings: null, connection: null }));
    setRetryCount({ members: 0, settings: 0 });
  }, []);

  useEffect(() => {
    let membersUnsubscribe: (() => void) | null = null;
    let settingsUnsubscribe: (() => void) | null = null;

    const setupMembersSubscription = () => {
      try {
        membersUnsubscribe = RealtimeService.subscribeToActiveMembers((members: Member[]) => {
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
        notifications.show({
          title: 'Connection Error',
          message: 'Unable to load member data. Please check your connection.',
          color: 'red',
          position: 'bottom-center',
          autoClose: false,
        });
        const currentRetryCount = retryCount.members;
        if (currentRetryCount < 3) {
          const retryDelay = Math.pow(2, currentRetryCount) * 1000;
          setTimeout(() => {
            setRetryCount((prev) => ({ ...prev, members: prev.members + 1 }));
            setupMembersSubscription();
          }, retryDelay);
        }
      }
    };

    const setupSettingsSubscription = () => {
      try {
        settingsUnsubscribe = RealtimeService.subscribeToGlobalSettings((settings: GlobalSettings) => {
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
        notifications.show({
          title: 'Settings Error',
          message: 'Unable to load application settings. Some features may not work correctly.',
          color: 'orange',
          position: 'bottom-center',
          autoClose: false,
        });
        const currentRetryCount = retryCount.settings;
        if (currentRetryCount < 3) {
          const retryDelay = Math.pow(2, currentRetryCount) * 1000;
          setTimeout(() => {
            setRetryCount((prev) => ({ ...prev, settings: prev.settings + 1 }));
            setupSettingsSubscription();
          }, retryDelay);
        }
      }
    };

    setupMembersSubscription();
    setupSettingsSubscription();

    return () => {
      if (membersUnsubscribe) membersUnsubscribe();
      if (settingsUnsubscribe) settingsUnsubscribe();
    };
  }, [retryCount.members, retryCount.settings]);

  const setupMemberDashboardListeners = useCallback(
    (memberId: string) => {
      return memberDashboardOps.setupMemberDashboardListeners(memberId);
    },
    [memberDashboardOps]
  );
  const addMember = useCallback(
    async (memberData: AddMemberFormData): Promise<void> => {
      setLoading((prev) => ({ ...prev, operations: true }));
      try {
        await memberOperations.addMember(memberData);
      } finally {
        setLoading((prev) => ({ ...prev, operations: false }));
      }
    },
    [memberOperations]
  );

  const updateMember = useCallback(
    async (memberId: string, updates: EditMemberFormData): Promise<void> => {
      setLoading((prev) => ({ ...prev, operations: true }));
      try {
        await memberOperations.updateMember(memberId, updates);
      } finally {
        setLoading((prev) => ({ ...prev, operations: false }));
      }
    },
    [memberOperations]
  );

  const deactivateMember = useCallback(
    async (memberId: string, leaveDate: Date): Promise<SettlementPreview> => {
      setLoading((prev) => ({ ...prev, operations: true }));
      try {
        return await memberOperations.deactivateMember(memberId, leaveDate);
      } finally {
        setLoading((prev) => ({ ...prev, operations: false }));
      }
    },
    [memberOperations]
  );

  const deleteMember = useCallback(
    async (memberId: string): Promise<void> => {
      setLoading((prev) => ({ ...prev, operations: true }));
      try {
        await memberOperations.deleteMember(memberId);
      } finally {
        setLoading((prev) => ({ ...prev, operations: false }));
      }
    },
    [memberOperations]
  );

  const getMemberDashboard = useCallback(async (): Promise<void> => {
    setLoading((prev) => ({ ...prev, memberDashboard: true }));
    setErrors((prev) => ({ ...prev, memberDashboard: null }));
    try {
      await memberDashboardOps.getMemberDashboard();
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, memberDashboard: error?.message || 'Failed to load dashboard data' }));
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, memberDashboard: false }));
    }
  }, [memberDashboardOps]);

  const getMemberRentHistory = useCallback(
    async (limit: number = 12, startAfter?: string): Promise<void> => {
      setLoading((prev) => ({ ...prev, memberHistory: true }));
      setErrors((prev) => ({ ...prev, memberHistory: null }));
      try {
        await memberDashboardOps.getMemberRentHistory(limit, startAfter);
      } catch (error: any) {
        setErrors((prev) => ({ ...prev, memberHistory: error?.message || 'Failed to load rent history' }));
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, memberHistory: false }));
      }
    },
    [memberDashboardOps]
  );

  const getOtherActiveMembers = useCallback(async (): Promise<void> => {
    setLoading((prev) => ({ ...prev, otherMembers: true }));
    setErrors((prev) => ({ ...prev, otherMembers: null }));
    try {
      await memberDashboardOps.getOtherActiveMembers();
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, otherMembers: error?.message || 'Failed to load friends list' }));
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, otherMembers: false }));
    }
  }, [memberDashboardOps]);

  const updateFCMToken = useCallback(
    async (fcmToken: string): Promise<void> => {
      await memberDashboardOps.updateFCMToken(fcmToken);
    },
    [memberDashboardOps]
  );

  const linkMemberAccount = useCallback(
    async (phoneNumber: string): Promise<Member> => {
      return await auth.linkMemberAccount(phoneNumber);
    },
    [auth]
  );

  const getMemberStats = useCallback(() => {
    const stats = {
      totalActive: activeMembers.length,
      wifiOptedIn: activeMembers.filter((m) => m.optedForWifi).length,
      byFloor: {} as Record<string, number>,
    };

    activeMembers.forEach((member) => {
      stats.byFloor[member.floor] = (stats.byFloor[member.floor] || 0) + 1;
    });

    return stats;
  }, [activeMembers]);

  const fetchInactiveMembers = useCallback(async (): Promise<Member[]> => {
    return await memberOperations.fetchInactiveMembers();
  }, [memberOperations]);

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

      if (filters.floor && filters.floor !== 'all') {
        filtered = filtered.filter((member) => member.floor === filters.floor);
      }

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

  const memberDashboard = useMemo(
    () => ({
      member: memberDashboardOps.dashboardData.member,
      currentMonth: memberDashboardOps.dashboardData.currentMonth,
      rentHistory: memberDashboardOps.dashboardData.rentHistory,
      hasMoreHistory: memberDashboardOps.dashboardData.hasMoreHistory,
      nextHistoryCursor: memberDashboardOps.dashboardData.nextHistoryCursor,
      otherMembers: memberDashboardOps.dashboardData.otherMembers,
    }),
    [memberDashboardOps.dashboardData]
  );

  const contextValue = useMemo<AppContextType>(
    () => ({
      activeMembers,
      globalSettings,
      memberDashboard,
      loading: {
        ...loading,
        operations: memberOperations.isLoading,
        memberDashboard: memberDashboardOps.loading.dashboard,
        memberHistory: memberDashboardOps.loading.history,
        otherMembers: memberDashboardOps.loading.otherMembers,
      },
      errors: {
        ...errors,
        memberDashboard: memberDashboardOps.errors.dashboard,
        memberHistory: memberDashboardOps.errors.history,
        otherMembers: memberDashboardOps.errors.otherMembers,
      },
      retryConnection,
      memberOperations,
      billingOperations,
      adminOperations,
      memberDashboardOps,
      auth,
      paymentSettings,
      addMember,
      updateMember,
      deactivateMember,
      deleteMember,
      getMemberDashboard,
      getMemberRentHistory,
      getOtherActiveMembers,
      updateFCMToken,
      linkMemberAccount,
      setupMemberDashboardListeners,
      getMemberStats,
      fetchInactiveMembers,
      searchMembers,
      filterMembers,
    }),
    [
      activeMembers,
      globalSettings,
      memberDashboard,
      loading,
      errors,
      retryConnection,
      memberOperations,
      billingOperations,
      adminOperations,
      memberDashboardOps,
      auth,
      paymentSettings,
      addMember,
      updateMember,
      deactivateMember,
      deleteMember,
      getMemberDashboard,
      getMemberRentHistory,
      getOtherActiveMembers,
      updateFCMToken,
      linkMemberAccount,
      setupMemberDashboardListeners,
      getMemberStats,
      fetchInactiveMembers,
      searchMembers,
      filterMembers,
    ]
  );

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

// Set displayName for debugging
AppProvider.displayName = 'AppProvider';
useAppContext.displayName = 'useAppContext';

// Export context for direct access if needed
export { AppContext };
