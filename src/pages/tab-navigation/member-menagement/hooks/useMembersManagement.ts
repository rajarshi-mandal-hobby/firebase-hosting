import { startTransition, useEffect, useEffectEvent, useState, type ChangeEvent } from 'react';
import { useMembers } from '../../../../contexts';
import type { FloorAndAll, MemberStatus, Member } from '../../../../data/types';


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
    searchQuery: ''
} as const;

interface FilteredMembersData {
    members: Member[];
    count: {
        activeCount: number;
        inactiveCount: number;
        totalCount: number;
    };
}

export const useMembersManagement = () => {
    const [filterMembers, setFilterMembers] = useState<FiltersType>(DefaultFilters);
    const { members, isLoading, error } = useMembers(filterMembers.accountStatus);
    const [filteredMembers, setFilteredMembers] = useState<FilteredMembersData>({
        members: [],
        count: { activeCount: 0, inactiveCount: 0, totalCount: members.length }
    });

    const filterMember = useEffectEvent(() => {
        const normalizedQuery = filterMembers.searchQuery.trim().toLowerCase();
        const filteredMembers = members.reduce<FilteredMembersData>(
            (acc, member) => {
                const isWifiMatch = !filterMembers.optedForWifi || member.optedForWifi;
                const isFloorMatch = filterMembers.floor === 'all' || member.floor === filterMembers.floor;
                const isSearchMatch =
                    !normalizedQuery
                    || member.name.toLowerCase().includes(normalizedQuery)
                    || member.phone.includes(normalizedQuery);

                if (isWifiMatch && isFloorMatch && isSearchMatch) {
                    return {
                        ...acc,
                        members: [...acc.members, member],
                        count: {
                            ...acc.count,
                            activeCount: acc.count.activeCount + (member.isActive ? 1 : 0),
                            inactiveCount: acc.count.inactiveCount + (member.isActive ? 0 : 1)
                        }
                    };
                }
                return acc;
            },
            { members: [], count: { activeCount: 0, inactiveCount: 0, totalCount: members.length } }
        );
        setFilteredMembers(filteredMembers);
    });

    // Using useEffect as I don't want to run it until I change the tab (Activity Mode is lazy)
    // Using startTransition to prevent React lint error about using useState synchronously inside useEffect
    useEffect(() => {
        startTransition(filterMember);
    }, [members, filterMembers]);

    const isDefaultFilterState = Object.keys(filterMembers).every(
        (key) => filterMembers[key as keyof FiltersType] === DefaultFilters[key as keyof FiltersType]
    );

    const updateFilter = (updates: Partial<FiltersType>) => {
        // check if updates are same as previous filter
        const isSame = Object.keys(updates).every(
            (key) => filterMembers[key as keyof FiltersType] === updates[key as keyof FiltersType]
        );
        if (isSame) return;
        setFilterMembers((prev) => ({ ...prev, ...updates }));
    };

    return {
        filteredMembers,
        isLoading,
        error,
        memberFilter: filterMembers,
        isDefaultFilterState,
        actions: {
            handleSearch(e: ChangeEvent<HTMLInputElement, HTMLInputElement>) {
                const query = e.currentTarget.value || '';
                updateFilter({ searchQuery: query });
            },
            resetSearch() {
                updateFilter({ searchQuery: '' });
            },
            handleStatusChange(e: React.MouseEvent<HTMLInputElement, MouseEvent>) {
                const status = e.currentTarget.value as MemberStatus;
                updateFilter({ accountStatus: status });
            },
            handleFloorChange(e: React.MouseEvent<HTMLInputElement, MouseEvent>) {
                const floor = e.currentTarget.value as FloorAndAll;
                console.log('Floor', floor);
                updateFilter({ floor: floor });
            },
            handleWifiOptChange() {
                updateFilter({ optedForWifi: !filterMembers.optedForWifi });
            },
            resetFilters() {
                setFilterMembers(DefaultFilters);
            }
        }
    } as const;
};
