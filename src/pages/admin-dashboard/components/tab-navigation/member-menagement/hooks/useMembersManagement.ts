import { useState, useEffectEvent, useEffect } from 'react';
import { type MemberStatus, useMembers } from '../../../../../../contexts';
import type { Floor, Member } from '../../../../../../data/types';

export interface FiltersType {
    floor: Floor | 'All';
    accountStatus: MemberStatus;
    optedForWifi: boolean;
    searchQuery: string;
}

const DefaultFilters: FiltersType = {
    floor: 'All',
    accountStatus: 'active',
    optedForWifi: false,
    searchQuery: ''
} as const;

interface FilteredMembersData {
    members: Member[];
    counts: {
        active: number;
        inactive: number;
        total: number;
    };
}

const DefaultFilteredMembers: FilteredMembersData = {
    members: [],
    counts: { active: 0, inactive: 0, total: 0 }
} as const;

export const useMembersManagement = () => {
    const [memberFilter, setMemberFilters] = useState<FiltersType>(DefaultFilters);
    const { members, isLoading, error, handleRefresh } = useMembers(memberFilter.accountStatus);
    const [filteredMembers, setFilteredMembers] = useState<FilteredMembersData>(DefaultFilteredMembers);

    const filterMembers = useEffectEvent(() => {
        const normalizedQuery = memberFilter.searchQuery.trim().toLowerCase();

        const filtered = members.reduce<FilteredMembersData>(
            (acc, member) => {
                const isWifiMatch = !memberFilter.optedForWifi || member.optedForWifi;
                const isFloorMatch = memberFilter.floor === 'All' || member.floor === memberFilter.floor;
                const isSearchMatch =
                    !normalizedQuery ||
                    member.name.toLowerCase().includes(normalizedQuery) ||
                    member.phone.includes(normalizedQuery);

                if (isWifiMatch && isFloorMatch && isSearchMatch) {
                    acc.members.push(member);
                    if (member.isActive) acc.counts.active++;
                    else acc.counts.inactive++;
                    acc.counts.total++;
                }
                return acc;
            },
            { members: [], counts: { active: 0, inactive: 0, total: 0 } }
        );

        setFilteredMembers((prev) => (prev.members.length === filtered.members.length ? prev : filtered));
    });

    useEffect(() => {
        filterMembers();
    }, [memberFilter]);

    const updateFilter = (updates: Partial<FiltersType>) => {
        setMemberFilters((prev) => (JSON.stringify(prev) === JSON.stringify(updates) ? prev : { ...prev, ...updates }));
    };

    const actions = {
        handleStatusChange: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
            const status = e.currentTarget.value as MemberStatus;
            updateFilter({ accountStatus: memberFilter.accountStatus === status ? 'active' : status });
        },
        handleFloorChange: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
            const floor = e.currentTarget.value as Floor | 'All';
            updateFilter({ floor: memberFilter.floor === floor ? 'All' : floor });
        },
        handleWifiOptChange: () => updateFilter({ optedForWifi: !memberFilter.optedForWifi }),
        resetFilters: () => setMemberFilters(DefaultFilters),
        handleRefresh
    };

    return {
        filteredMembers,
        isLoading,
        error,
        memberFilter,
        isDefaultFilterState: JSON.stringify(memberFilter) === JSON.stringify(DefaultFilters),
        actions,
        searchActions: {
            handleSearchQueryChange: (query: string) => updateFilter({ searchQuery: query })
        }
    } as const;
};
