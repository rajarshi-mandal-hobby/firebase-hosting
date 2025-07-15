/**
 * DataContext - Type definitions for centralized data management
 */

import { createContext } from 'react';
import type { GlobalSettings, Member, AdminConfig, RentHistory } from '../shared/types/firestore-types';

export interface GetMembersOptions {
  isActive?: boolean;
}

export interface DataContextType {
  // Data getters with caching
  getGlobalSettings: () => Promise<GlobalSettings>;
  getMembers: (options?: GetMembersOptions) => Promise<Member[]>;
  getMember: (memberId: string) => Promise<Member | null>;
  getAdminConfig: () => Promise<AdminConfig>;
  getMemberRentHistory: (memberId: string) => Promise<RentHistory[]>;

  // Loading states
  isLoading: (key: string) => boolean;

  // Cache management
  invalidateCache: (key?: string) => void;
  getCacheKey: (operation: string, params?: Record<string, unknown>) => string;
}

export const DataContext = createContext<DataContextType | null>(null);
