/**
 * 🚀 ADMIN DASHBOARD ENHANCED CONTEXT
 *
 * Following the proven patterns from MemberDashboardContext.tsx
 * Optimized for: ≤5 commits for tab switching, production reliability
 *
 * Reuses:
 * - Performance tracking pattern
 * - Component stabilization
 * - Smart data provider
 * - On-demand loading strategy
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { AdminConfig } from '../../shared/types/firestore-types';
import { useRentManagementData, type UseRentManagementData } from '../../features/rent/hooks/useRentManagementData';
import {
  useMemberManagementData,
  type UseMemberManagementData,
} from '../../features/members/hooks/useMemberManagementData';
import { ConfigService } from '../services';

// =============================================
// TYPES & INTERFACES
// =============================================

export type AdminTab = 'rent' | 'members' | 'config';

export interface AdminDashboardState {
  rentData: UseRentManagementData;
  membersData: UseMemberManagementData;
  configData: {
    adminConfig: AdminConfig | null;
    globalSettings: any | null;
    loading: boolean;
    error: string | null;
    loaded: boolean;
  };
  adminInfo: AdminConfig | null;
  activeTab: AdminTab;
  dataLoadingFlags: {
    rentLoaded: boolean;
    membersLoaded: boolean;
    configLoaded: boolean;
  };
}

export interface AdminDashboardActions {
  setActiveTab: (tab: AdminTab) => void;
  loadRentData: () => Promise<void>;
  loadMembersData: () => Promise<void>;
  loadConfigData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  resetPerformanceStats: () => void;
}

export interface AdminDashboardProviderProps {
  children: React.ReactNode;
  enablePerformanceMonitoring?: boolean;
  enableAdvancedStabilization?: boolean;
  enableDebugLogging?: boolean;
}

export interface EnhancedAdminDashboardData extends AdminDashboardState {
  // Performance tracking
  renderCount: number;
  commitCount: number;
  tabSwitchCount: number;
  lastUpdated: number;
}

// =============================================
// PERFORMANCE TRACKING (Reused Pattern)
// =============================================

class AdminPerformanceTracker {
  private stats = {
    renders: 0,
    commits: 0,
    tabSwitches: 0,
    startTime: Date.now(),
  };

  private subscribers = new Set<(stats: typeof this.stats & { uptime: number }) => void>();

  trackRender() {
    this.stats.renders++;
    this.notifySubscribers();
  }

  trackCommit() {
    this.stats.commits++;
    this.notifySubscribers();
  }

  trackTabSwitch() {
    this.stats.tabSwitches++;
    this.notifySubscribers();
  }

  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime,
    };
  }

  reset() {
    this.stats = {
      renders: 0,
      commits: 0,
      tabSwitches: 0,
      startTime: Date.now(),
    };
    this.notifySubscribers();
  }

  subscribe(callback: (stats: typeof this.stats & { uptime: number }) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    const stats = this.getStats();
    this.subscribers.forEach((callback) => callback(stats));
  }
}

const adminPerformanceTracker = new AdminPerformanceTracker();

// =============================================
// STABILIZATION UTILITIES (Reused Pattern)
// =============================================

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

function useStableData<T>(
  data: T,
  options: {
    enableDeepComparison?: boolean;
    enableDebugLogging?: boolean;
    name?: string;
  } = {}
): T {
  const { enableDeepComparison = false, enableDebugLogging = false, name = 'data' } = options;
  const previousDataRef = useRef<T>(data);
  const renderCountRef = useRef(0);

  renderCountRef.current++;

  const isEqual = enableDeepComparison ? deepEqual(previousDataRef.current, data) : previousDataRef.current === data;

  if (!isEqual) {
    if (enableDebugLogging && process.env.NODE_ENV === 'development') {
      console.warn(`[useStableData:${name}] Data changed on render ${renderCountRef.current}`, {
        previous: previousDataRef.current,
        current: data,
      });
    }
    previousDataRef.current = data;
  }

  return previousDataRef.current;
}

// =============================================
// CONTEXT IMPLEMENTATION
// =============================================

const AdminDashboardDataContext = createContext<EnhancedAdminDashboardData | null>(null);
const AdminDashboardActionsContext = createContext<AdminDashboardActions | null>(null);

// =============================================
// CUSTOM CONFIG DATA HOOK
// =============================================

function useConfigData() {
  const [configData, setConfigData] = useState({
    adminConfig: null as AdminConfig | null,
    globalSettings: null as any,
    loading: false,
    error: null as string | null,
    loaded: false,
  });

  const loadConfigData = useCallback(async () => {
    if (configData.loaded) return;

    try {
      setConfigData((prev) => ({ ...prev, loading: true, error: null }));

      const [adminConfig, globalSettings] = await Promise.all([
        ConfigService.getAdminConfig(),
        ConfigService.getGlobalSettings(),
      ]);

      setConfigData({
        adminConfig,
        globalSettings,
        loading: false,
        error: null,
        loaded: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load config';
      setConfigData((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [configData.loaded]);

  return { configData, loadConfigData };
}

// =============================================
// PROVIDER COMPONENT
// =============================================

export function AdminDashboardProvider({
  children,
  enablePerformanceMonitoring = false,
  enableAdvancedStabilization = false,
  enableDebugLogging = false,
}: AdminDashboardProviderProps) {
  // Tab state
  const [activeTab, setActiveTabState] = useState<AdminTab>('rent');

  // Data loading flags
  const [dataLoadingFlags, setDataLoadingFlags] = useState({
    rentLoaded: false,
    membersLoaded: false,
    configLoaded: false,
  });

  // Data hooks - rent data loads immediately (primary tab)
  const rentData = useRentManagementData();

  // Members data - load on demand
  const membersDataRaw = useMemberManagementData();

  // Config data - load on demand
  const { configData, loadConfigData } = useConfigData();

  // Admin info from config
  const [adminInfo, setAdminInfo] = useState<AdminConfig | null>(null);

  // Performance tracking
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      adminPerformanceTracker.trackRender();
    }
  });

  // Load admin info on mount
  useEffect(() => {
    ConfigService.getAdminConfig().then(setAdminInfo).catch(console.error);
  }, []);

  // Mark rent data as loaded when available
  useEffect(() => {
    if (rentData.cache.rentLoaded && !dataLoadingFlags.rentLoaded) {
      setDataLoadingFlags((prev) => ({ ...prev, rentLoaded: true }));
    }
  }, [rentData.cache.rentLoaded, dataLoadingFlags.rentLoaded]);

  // Apply stabilization if enabled
  const stableRentData = useStableData(rentData, {
    enableDeepComparison: enableAdvancedStabilization,
    enableDebugLogging: enableAdvancedStabilization && enableDebugLogging,
    name: 'rentData',
  });

  const stableMembersData = useStableData(membersDataRaw, {
    enableDeepComparison: enableAdvancedStabilization,
    enableDebugLogging: enableAdvancedStabilization && enableDebugLogging,
    name: 'membersData',
  });

  const stableConfigData = useStableData(configData, {
    enableDeepComparison: enableAdvancedStabilization,
    enableDebugLogging: enableAdvancedStabilization && enableDebugLogging,
    name: 'configData',
  });

  // Use stabilized data only if stabilization is enabled
  const finalRentData = enableAdvancedStabilization ? stableRentData : rentData;
  const finalMembersData = enableAdvancedStabilization ? stableMembersData : membersDataRaw;
  const finalConfigData = enableAdvancedStabilization ? stableConfigData : configData;

  // Enhanced dashboard state
  const enhancedData = useMemo((): EnhancedAdminDashboardData => {
    const stats = enablePerformanceMonitoring
      ? adminPerformanceTracker.getStats()
      : { renders: 0, commits: 0, tabSwitches: 0 };

    return {
      rentData: finalRentData,
      membersData: finalMembersData,
      configData: finalConfigData,
      adminInfo,
      activeTab,
      dataLoadingFlags,
      renderCount: stats.renders,
      commitCount: stats.commits,
      tabSwitchCount: stats.tabSwitches,
      lastUpdated: Date.now(),
    };
  }, [
    finalRentData,
    finalMembersData,
    finalConfigData,
    adminInfo,
    activeTab,
    dataLoadingFlags,
    enablePerformanceMonitoring,
  ]);

  // Actions
  const actions = useMemo(
    (): AdminDashboardActions => ({
      setActiveTab: (tab: AdminTab) => {
        if (enablePerformanceMonitoring) {
          adminPerformanceTracker.trackTabSwitch();
        }

        if (enableDebugLogging && process.env.NODE_ENV === 'development') {
          console.warn('[AdminDashboardProvider] Tab switch', { from: activeTab, to: tab });
        }

        setActiveTabState(tab);

        // Load data on demand
        if (tab === 'members' && !dataLoadingFlags.membersLoaded) {
          setDataLoadingFlags((prev) => ({ ...prev, membersLoaded: true }));
        } else if (tab === 'config' && !dataLoadingFlags.configLoaded) {
          loadConfigData();
          setDataLoadingFlags((prev) => ({ ...prev, configLoaded: true }));
        }
      },

      loadRentData: async () => {
        if (enablePerformanceMonitoring) {
          adminPerformanceTracker.trackCommit();
        }

        finalRentData.actions.refetch();
      },

      loadMembersData: async () => {
        if (enablePerformanceMonitoring) {
          adminPerformanceTracker.trackCommit();
        }

        finalMembersData.actions.refetch();
        setDataLoadingFlags((prev) => ({ ...prev, membersLoaded: true }));
      },

      loadConfigData: async () => {
        if (enablePerformanceMonitoring) {
          adminPerformanceTracker.trackCommit();
        }

        await loadConfigData();
        setDataLoadingFlags((prev) => ({ ...prev, configLoaded: true }));
      },

      refreshAllData: async () => {
        if (enablePerformanceMonitoring) {
          adminPerformanceTracker.trackCommit();
        }

        if (enableDebugLogging && process.env.NODE_ENV === 'development') {
          console.warn('[AdminDashboardProvider] Refreshing all data');
        }

        // Reset all data and reload
        setDataLoadingFlags({ rentLoaded: false, membersLoaded: false, configLoaded: false });

        finalRentData.actions.refetch();
        finalMembersData.actions.refetch();
        await loadConfigData();
      },

      resetPerformanceStats: () => {
        if (enablePerformanceMonitoring) {
          adminPerformanceTracker.reset();
        }
      },
    }),
    [
      activeTab,
      dataLoadingFlags,
      finalRentData,
      finalMembersData,
      loadConfigData,
      enablePerformanceMonitoring,
      enableDebugLogging,
    ]
  );

  // Debug logging
  useEffect(() => {
    if (enableDebugLogging && process.env.NODE_ENV === 'development') {
      console.warn('[AdminDashboardProvider] Render', {
        activeTab,
        dataLoadingFlags,
        performanceEnabled: enablePerformanceMonitoring,
        stabilizationEnabled: enableAdvancedStabilization,
      });
    }
  });

  return (
    <AdminDashboardDataContext.Provider value={enhancedData}>
      <AdminDashboardActionsContext.Provider value={actions}>{children}</AdminDashboardActionsContext.Provider>
    </AdminDashboardDataContext.Provider>
  );
}

// =============================================
// HOOKS
// =============================================

export function useAdminDashboardData(): EnhancedAdminDashboardData {
  const context = useContext(AdminDashboardDataContext);
  if (!context) {
    throw new Error('useAdminDashboardData must be used within AdminDashboardProvider');
  }
  return context;
}

export function useAdminDashboardActions(): AdminDashboardActions {
  const context = useContext(AdminDashboardActionsContext);
  if (!context) {
    throw new Error('useAdminDashboardActions must be used within AdminDashboardProvider');
  }
  return context;
}

// Combined hook for convenience
export function useAdminDashboardContext() {
  return {
    data: useAdminDashboardData(),
    actions: useAdminDashboardActions(),
  };
}

// =============================================
// PERFORMANCE MONITORING COMPONENT
// =============================================

export function AdminPerformanceMonitor({
  children,
  id = 'AdminDashboard',
}: {
  children: React.ReactNode;
  id?: string;
}) {
  const profilerCallback = useCallback(
    (
      id: string,
      phase: 'mount' | 'update' | 'nested-update',
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number
    ) => {
      adminPerformanceTracker.trackCommit();

      if (process.env.NODE_ENV === 'development') {
        console.warn(`[AdminPerformanceMonitor:${id}] ${phase}`, {
          actualDuration,
          baseDuration,
          startTime,
          commitTime,
        });
      }
    },
    []
  );

  if (process.env.NODE_ENV === 'development') {
    return (
      <React.Profiler id={id} onRender={profilerCallback}>
        {children}
      </React.Profiler>
    );
  }

  return <>{children}</>;
}

// =============================================
// DEVELOPMENT TOOLS
// =============================================

export function AdminPerformanceDashboard() {
  const [stats, setStats] = useState(adminPerformanceTracker.getStats());

  useEffect(() => {
    const unsubscribe = adminPerformanceTracker.subscribe((newStats) => {
      setStats(newStats);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const isPerformant = stats.commits <= 5;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 9999,
        minWidth: '200px',
        border: `2px solid ${isPerformant ? '#4CAF50' : '#f44336'}`,
      }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>🎯 Admin Performance</div>
      <div>Renders: {stats.renders}</div>
      <div style={{ color: isPerformant ? '#4CAF50' : '#f44336' }}>
        Commits: {stats.commits} {isPerformant ? '✅' : '⚠️'}
      </div>
      <div>Tab Switches: {stats.tabSwitches}</div>
      <div>Uptime: {Math.floor(stats.uptime / 1000)}s</div>

      <button
        onClick={() => adminPerformanceTracker.reset()}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          fontSize: '10px',
          background: '#333',
          color: 'white',
          border: '1px solid #555',
          borderRadius: '4px',
          cursor: 'pointer',
        }}>
        Reset
      </button>
    </div>
  );
}

// =============================================
// EXPORTS
// =============================================

export default AdminDashboardProvider;

// Export performance tracker for external use
export { adminPerformanceTracker };
