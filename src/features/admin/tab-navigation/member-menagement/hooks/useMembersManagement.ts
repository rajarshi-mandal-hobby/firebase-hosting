import { useState } from 'react';
import { useMembers, type MemberStatus } from '../../../../../data/services/membersService';
import type { Floor, Member } from '../../../../../data/types';

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

/**
 * Custom hook for members management data with independent filtering
 * Handles fetching and merging of active and inactive members
 */
export const useMembersManagement = () => {
    const [memberFilter, setMemberFilters] = useState<FiltersType>(DefaultFilters);
    const { members, isLoading, error, refresh } = useMembers(memberFilter.accountStatus);

    // Search and filter states
    const isDefaultFilterState = JSON.stringify(memberFilter) === JSON.stringify(DefaultFilters);

    const getFilteredData = (() => {
        const normalizedQuery = memberFilter.searchQuery.trim().toLowerCase();

        // Initialize counters and result array in one place
        const results: Member[] = [];
        let activeCount = 0;
        let inactiveCount = 0;

        // Use a traditional for-loop or for...of for maximum performance
        for (const member of members) {
            // 1. WiFi Check
            if (memberFilter.optedForWifi && !member.optedForWifi) continue;

            // 2. Floor Check
            if (memberFilter.floor !== 'All' && member.floor !== memberFilter.floor) continue;

            // 3. Search Query Check
            if (normalizedQuery) {
                const nameMatch = member.name.toLowerCase().includes(normalizedQuery);
                const phoneMatch = member.phone.includes(normalizedQuery);
                if (!nameMatch && !phoneMatch) continue;
            }

            // If it passed all filters, add to results and update counts
            results.push(member);
            if (member.isActive) activeCount++;
            else inactiveCount++;
        }

        return {
            filteredMembers: results,
            counts: {
                activeMembers: activeCount,
                inactiveMembers: inactiveCount,
                totalMembers: members.length
            }
        };
    })();

    const handleStatusChange = (e: React.MouseEvent<HTMLButtonElement>) => {
        const status = e.currentTarget.value as MemberStatus;
        const prevStatus = memberFilter.accountStatus;
        // Gaurd clause for default active status
        if (prevStatus === 'active' && status === 'active') return;

        setMemberFilters((prev) => ({
            ...prev,
            accountStatus: prevStatus === status ? 'active' : status
        }));
    };

    const handleFloorChange = (e: React.MouseEvent<HTMLButtonElement>) => {
        const floor = e.currentTarget.value as Floor | 'All';
        const prevFloor = memberFilter.floor;
        // Gaurd for default floor
        if (prevFloor === 'All' && floor === 'All') return;
        setMemberFilters((prev) => ({
            ...prev,
            floor: prevFloor === floor ? 'All' : floor
        }));
    };

    const handleWifiOptChange = () => {
        setMemberFilters((prev) => ({
            ...prev,
            optedForWifi: !prev.optedForWifi
        }));
    };

    const resetFilters = () => {
        setMemberFilters(DefaultFilters);
    };

    const handleSearchQueryChange = (query: string) => {
        setMemberFilters((prev) => ({
            ...prev,
            searchQuery: query
        }));
    };

    return {
        // Data
        getFilteredData,
        isLoading,
        error,
        // Filter State
        memberFilter,
        isDefaultFilterState,
        // Actions
        actions: {
            // Filter Actions
            handleStatusChange,
            handleFloorChange,
            handleWifiOptChange,
            resetFilters,
            // Data Actions
            refresh
        },
        // Search Actions
        searchActions: {
            handleSearchQueryChange
        }
    } as const;
};
