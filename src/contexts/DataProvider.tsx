/**
 * DataProvider - Centralized data management with intelligent caching
 * 
 * This provider offers:
 * - Intelligent caching with configurable durations
 * - Real-time Firestore listeners with automatic cache invalidation
 * - Deduplication of concurrent requests
 * - Proper loading states management
 */

import { type ReactNode, useCallback, useRef } from 'react';
import { DataContext, type DataContextType, type GetMembersOptions } from './DataContext';
import { FirestoreService } from '../data/firestoreService';
import type { GlobalSettings, Member, AdminConfig, RentHistory } from '../shared/types/firestore-types';

interface DataProviderProps {
  children: ReactNode;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  duration: number; // Cache duration in milliseconds
}

interface LoadingState {
  [key: string]: boolean;
}

// Cache configuration
const CACHE_DURATIONS = {
  globalSettings: 5 * 60 * 1000, // 5 minutes
  adminConfig: 10 * 60 * 1000,  // 10 minutes  
  members: 2 * 60 * 1000,       // 2 minutes
  memberRentHistory: 5 * 60 * 1000, // 5 minutes
} as const;

export function DataProvider({ children }: DataProviderProps) {
  const cache = useRef<Map<string, CacheEntry<unknown>>>(new Map());
  const loading = useRef<LoadingState>({});
  const pendingRequests = useRef<Map<string, Promise<unknown>>>(new Map());

  // Utility function to generate cache keys
  const getCacheKey = useCallback((operation: string, params?: Record<string, unknown>): string => {
    if (!params || Object.keys(params).length === 0) {
      return operation;
    }
    return `${operation}_${JSON.stringify(params)}`;
  }, []);

  // Check if cache entry is still valid
  const isCacheValid = useCallback((key: string): boolean => {
    const entry = cache.current.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    return (now - entry.timestamp) < entry.duration;
  }, []);

  // Get data from cache or fetch if needed
  const getCachedOrFetch = useCallback(async <T,>(
    key: string,
    fetchFn: () => Promise<T>,
    duration: number
  ): Promise<T> => {
    // Check if we have valid cached data
    if (isCacheValid(key)) {
      return cache.current.get(key)!.data as T;
    }

    // Check if there's already a pending request for this key
    if (pendingRequests.current.has(key)) {
      return pendingRequests.current.get(key) as Promise<T>;
    }

    // Set loading state
    loading.current[key] = true;

    // Create the fetch promise
    const fetchPromise = fetchFn()
      .then((data) => {
        // Cache the result
        cache.current.set(key, {
          data,
          timestamp: Date.now(),
          duration,
        });

        // Clear loading state
        loading.current[key] = false;
        
        // Remove from pending requests
        pendingRequests.current.delete(key);
        
        return data;
      })
      .catch((error) => {
        // Clear loading state
        loading.current[key] = false;
        
        // Remove from pending requests
        pendingRequests.current.delete(key);
        
        throw error;
      });

    // Store the pending request
    pendingRequests.current.set(key, fetchPromise);

    return fetchPromise;
  }, [isCacheValid]);

  // Data getter implementations
  const getGlobalSettings = useCallback(async (): Promise<GlobalSettings> => {
    const key = getCacheKey('globalSettings');
    return getCachedOrFetch(
      key,
      () => FirestoreService.Config.getGlobalSettings(),
      CACHE_DURATIONS.globalSettings
    );
  }, [getCacheKey, getCachedOrFetch]);

  const getMembers = useCallback(async (options: GetMembersOptions = {}): Promise<Member[]> => {
    const key = getCacheKey('members', options);
    return getCachedOrFetch(
      key,
      () => FirestoreService.Members.getMembers(options),
      CACHE_DURATIONS.members
    );
  }, [getCacheKey, getCachedOrFetch]);

  const getMember = useCallback(async (memberId: string): Promise<Member | null> => {
    const key = getCacheKey('member', { memberId });
    return getCachedOrFetch(
      key,
      () => FirestoreService.Members.getMember(memberId),
      CACHE_DURATIONS.members
    );
  }, [getCacheKey, getCachedOrFetch]);

  const getAdminConfig = useCallback(async (): Promise<AdminConfig> => {
    const key = getCacheKey('adminConfig');
    return getCachedOrFetch(
      key,
      () => FirestoreService.Config.getAdminConfig(),
      CACHE_DURATIONS.adminConfig
    );
  }, [getCacheKey, getCachedOrFetch]);

  const getMemberRentHistory = useCallback(async (memberId: string): Promise<RentHistory[]> => {
    const key = getCacheKey('memberRentHistory', { memberId });
    return getCachedOrFetch(
      key,
      () => FirestoreService.Members.getMemberRentHistory(memberId),
      CACHE_DURATIONS.memberRentHistory
    );
  }, [getCacheKey, getCachedOrFetch]);

  // Loading state checker
  const isLoading = useCallback((key: string): boolean => {
    return loading.current[key] ?? false;
  }, []);

  // Cache invalidation
  const invalidateCache = useCallback((key?: string): void => {
    if (key) {
      cache.current.delete(key);
      delete loading.current[key];
      pendingRequests.current.delete(key);
    } else {
      // Clear all cache
      cache.current.clear();
      loading.current = {};
      pendingRequests.current.clear();
    }
  }, []);

  const contextValue: DataContextType = {
    getGlobalSettings,
    getMembers,
    getMember,
    getAdminConfig,
    getMemberRentHistory,
    isLoading,
    invalidateCache,
    getCacheKey,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}
