import { useMemo, useState, useCallback } from 'react';
import { useActiveMembersLatestRentShared } from './useActiveMembersLatestRentShared';
import { getInactiveMembers } from '../../../data/services/membersService.new';
import type { Member } from '../../../shared/types/firestore-types';

let inactiveCache: { data: Member[]; loaded: boolean; loading: boolean; error: string | null } = {
  data: [],
  loaded: false,
  loading: false,
  error: null,
};

export const clearInactiveCache = () => {
  inactiveCache = { data: [], loaded: false, loading: false, error: null };
};

export const useMembersTabData = () => {
  const { membersWithLatest, loading: activeLoading, error: activeError, actions } = useActiveMembersLatestRentShared();

  const [includeInactive, setIncludeInactive] = useState(false);
  const [, force] = useState(0); // force-local rerender when inactive cache updates

  const loadInactiveOnce = useCallback(async () => {
    if (inactiveCache.loaded || inactiveCache.loading) return;
    inactiveCache.loading = true;
    try {
      const members = await getInactiveMembers();
      inactiveCache = { data: members, loaded: true, loading: false, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load inactive members';
      inactiveCache = { ...inactiveCache, loading: false, error: message };
    } finally {
      force((v) => v + 1);
    }
  }, []);

  const activeMembers = useMemo(() => {
    return membersWithLatest.map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rentHistory, ...rest } = m as any;
      return rest as Member;
    });
  }, [membersWithLatest]);

  const mergedMembers =
    includeInactive && inactiveCache.loaded ? [...activeMembers, ...inactiveCache.data] : activeMembers;

  return {
    activeMembers,
    inactiveMembers: inactiveCache.data,
    mergedMembers,
    loading: activeLoading || (includeInactive && !inactiveCache.loaded && inactiveCache.loading),
    error: activeError || (includeInactive ? inactiveCache.error : null),
    flags: { includeInactive, inactiveLoaded: inactiveCache.loaded },
    actions: {
      setIncludeInactive,
      refetchActive: actions.refetch,
      loadInactiveOnce,
    },
  } as const;
};
