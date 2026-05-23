import { startTransition, useEffect, useEffectEvent, useState } from 'react';
import { useMembers } from '../../../../../../contexts';
import type { FloorAndAll, Member, MemberStatus } from '../../../../../../data/types';

export interface FiltersType {
    floor: FloorAndAll;
    accountStatus: MemberStatus;
    optedForWifi: boolean;
    searchQuery: string;
}

const DefaultFilters: FiltersType = {
    floor: 'all',
    accountStatus: 'active',
    optedForWifi: false,
    searchQuery: '',
} as const;

interface FilteredMembersData {
    members: Member[];
    counts: {
        active: number;
        inactive: number;
        total: number;
    };
}

export const useMembersManagement = () => {
    const [filterMembers, setFilterMembers] = useState<FiltersType>(DefaultFilters);
    const { members, isLoading, error } = useMembers(filterMembers.accountStatus);
    const [filteredMembers, setFilteredMembers] = useState<FilteredMembersData>({
        members: [],
        counts: { active: 0, inactive: 0, total: members.length },
    });

    const filterMember = useEffectEvent(() => {
        const normalizedQuery = filterMembers.searchQuery.trim().toLowerCase();
        const filteredMembers = members.reduce<FilteredMembersData>(
            (acc, member) => {
                const isWifiMatch = !filterMembers.optedForWifi || member.optedForWifi;
                const isFloorMatch = filterMembers.floor === 'all' || member.floor === filterMembers.floor;
                const isSearchMatch =
                    !normalizedQuery ||
                    member.name.toLowerCase().includes(normalizedQuery) ||
                    member.phone.includes(normalizedQuery);

                if (isWifiMatch && isFloorMatch && isSearchMatch) {
                    return {
                        ...acc,
                        members: [...acc.members, member],
                        counts: {
                            ...acc.counts,
                            active: acc.counts.active + (member.isActive ? 1 : 0),
                            inactive: acc.counts.inactive + (member.isActive ? 0 : 1),
                        },
                    };
                }
                return acc;
            },
            { members: [], counts: { active: 0, inactive: 0, total: members.length } },
        );
        setFilteredMembers(filteredMembers);
    });

    // Using useEffect as I don't want to run it until I change the tab (Activity Mode is lazy)
    // Using startTransition to prevent React lint error about using useState synchronously inside useEffect
    useEffect(() => {
        startTransition(filterMember);
    }, [members, filterMembers]);

    const isDefaultFilterState = Object.keys(filterMembers).every(
        (key) => filterMembers[key as keyof FiltersType] === DefaultFilters[key as keyof FiltersType],
    );

    const updateFilter = (updates: Partial<FiltersType>) => {
        // check if updates are same as previous filter
        const isSame = Object.keys(updates).every(
            (key) => filterMembers[key as keyof FiltersType] === updates[key as keyof FiltersType],
        );
        if (isSame) return;
        setFilterMembers((prev) => ({ ...prev, ...updates }));
    };

    const actions = {
        handleSearchQueryChange: (query: string) => updateFilter({ searchQuery: query }),
        handleStatusChange: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
            const status = e.currentTarget.value as MemberStatus;
            updateFilter({ accountStatus: status });
        },
        handleFloorChange: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
            const floor = e.currentTarget.value as FloorAndAll;
            console.log('Floor', floor);
            updateFilter({ floor: floor });
        },
        handleWifiOptChange: () => updateFilter({ optedForWifi: !filterMembers.optedForWifi }),
        resetFilters: () => setFilterMembers(DefaultFilters),
    };

    return {
        filteredMembers,
        isLoading,
        error,
        memberFilter: filterMembers,
        isDefaultFilterState,
        actions,
    } as const;
};
