/**
 * Data Context Provider with Caching
 * 
 * This provider wraps FirestoreService calls with intelligent caching
 * to minimize database requests while keeping data fresh.
 */

import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import FirestoreService from '../data/firestoreService';
import type { GlobalSettings, Member, AdminConfig, RentHistory } from '../shared/types/firestore-types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface DataContextType {
  // Global Settings
  getGlobalSettings: () => Promise<GlobalSettings>;
  
  // Members
  getMembers: (options?: { isActive?: boolean }) => Promise<Member[]>;
  getMember: (memberId: string) => Promise<Member | null>;
  
  // Admin
  getAdminConfig: () => Promise<AdminConfig>;
  
  // Rent History
  getMemberRentHistory: (memberId: string) => Promise<RentHistory[]>;
  
  // Cache management
  invalidateCache: (key?: string) => void;
  subscribeToRealTimeUpdates: () => () => void;
  
  // Loading states
  isLoading: (key: string) => boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cache = useRef<Map<string, CacheEntry<unknown>>>(new Map());
  const loadingStates = useRef<Map<string, boolean>>(new Map());
  const subscribers = useRef<Map<string, (() => void)[]>>(new Map());

  // Cache configuration (in milliseconds)
  const CACHE_DURATION = {
    globalSettings: 5 * 60 * 1000,   // 5 minutes
    members: 2 * 60 * 1000,          // 2 minutes  
    adminConfig: 10 * 60 * 1000,     // 10 minutes
    memberDetails: 1 * 60 * 1000,    // 1 minute
    rentHistory: 3 * 60 * 1000,      // 3 minutes
  };

  const getCachedOrFetch = useCallback(async function<T>(
    key: string,
    fetcher: () => Promise<T>,
    duration: number
  ): Promise<T> {
    const cached = cache.current.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    // Return cached data if valid
    if (cached && now < cached.timestamp + duration) {
      return cached.data;
    }

    // Check if already loading
    if (loadingStates.current.get(key)) {
      // Wait for ongoing request
      return new Promise<T>((resolve) => {
        const checkCache = () => {
          const updated = cache.current.get(key) as CacheEntry<T> | undefined;
          if (updated && updated.timestamp > (cached?.timestamp || 0)) {
            resolve(updated.data);
          } else {
            setTimeout(checkCache, 50);
          }
        };
        checkCache();
      });
    }

    // Set loading state
    loadingStates.current.set(key, true);

    try {
      // Fetch fresh data
      const data = await fetcher();
      cache.current.set(key, {
        data,
        timestamp: now,
        expiry: now + duration
      });

      // Notify subscribers
      const keySubscribers = subscribers.current.get(key) || [];
      keySubscribers.forEach(callback => callback());

      return data;
    } finally {
      loadingStates.current.set(key, false);
    }
  }, []);

  // Global Settings
  const getGlobalSettings = useCallback(() => 
    getCachedOrFetch(
      'globalSettings',
      FirestoreService.Config.getGlobalSettings,
      CACHE_DURATION.globalSettings
    ), [getCachedOrFetch, CACHE_DURATION.globalSettings]);

  // Members
  const getMembers = useCallback((options?: { isActive?: boolean }) => {
    const key = `members_${JSON.stringify(options || {})}`;
    return getCachedOrFetch(
      key,
      () => FirestoreService.Members.getMembers(options),
      CACHE_DURATION.members
    );
  }, [getCachedOrFetch, CACHE_DURATION.members]);

  const getMember = useCallback((memberId: string) => {
    const key = `member_${memberId}`;
    return getCachedOrFetch(
      key,
      () => FirestoreService.Members.getMember(memberId),
      CACHE_DURATION.memberDetails
    );
  }, [getCachedOrFetch, CACHE_DURATION.memberDetails]);

  // Admin Config
  const getAdminConfig = useCallback(() =>
    getCachedOrFetch(
      'adminConfig',
      FirestoreService.Config.getAdminConfig,
      CACHE_DURATION.adminConfig
    ), [getCachedOrFetch, CACHE_DURATION.adminConfig]);

  // Rent History
  const getMemberRentHistory = useCallback((memberId: string) => {
    const key = `rentHistory_${memberId}`;
    return getCachedOrFetch(
      key,
      () => FirestoreService.Members.getMemberRentHistory(memberId),
      CACHE_DURATION.rentHistory
    );
  }, [getCachedOrFetch, CACHE_DURATION.rentHistory]);

  // Cache management
  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      cache.current.delete(key);
      // Invalidate related keys
      if (key === 'globalSettings') {
        // Invalidate anything that might depend on global settings
        cache.current.delete('members_{}');
        cache.current.delete('members_{"isActive":true}');
      }
    } else {
      cache.current.clear();
    }
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates.current.get(key) || false;
  }, []);

  const subscribeToRealTimeUpdates = useCallback(() => {
    console.log('🔥 Setting up real-time listeners...');
    
    // Set up real-time listeners that invalidate cache when data changes
    const unsubscribeSettings = FirestoreService.Realtime.subscribeToGlobalSettings(() => {
      console.log('🔄 Global settings updated, invalidating cache');
      invalidateCache('globalSettings');
    });

    const unsubscribeMembers = FirestoreService.Realtime.subscribeToAllMembers(() => {
      console.log('🔄 Members updated, invalidating cache');
      invalidateCache('members_{"isActive":true}');
      invalidateCache('members_{}');
    });

    return () => {
      console.log('🛑 Cleaning up real-time listeners');
      unsubscribeSettings();
      unsubscribeMembers();
    };
  }, [invalidateCache]);

  // Set up real-time updates on mount
  useEffect(() => {
    const cleanup = subscribeToRealTimeUpdates();
    return cleanup;
  }, [subscribeToRealTimeUpdates]);

  const contextValue: DataContextType = {
    getGlobalSettings,
    getMembers,
    getMember,
    getAdminConfig,
    getMemberRentHistory,
    invalidateCache,
    subscribeToRealTimeUpdates,
    isLoading,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
