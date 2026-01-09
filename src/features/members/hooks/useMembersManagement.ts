import { useState, useEffect, useMemo, useEffectEvent } from "react";
import { fetchMembers } from "../../../data/services/membersService";
import type { Floor, Member } from "../../../data/types";

export type AccountStatusFilter = "all" | "active" | "inactive";

export type FiltersType = {
	floor: Floor | "All";
	accountStatus: AccountStatusFilter;
	optedForWifi: boolean;
	latestInactiveMembers: boolean;
};

export const defaultFilters: FiltersType = {
	floor: "All",
	accountStatus: "active",
	optedForWifi: false,
	latestInactiveMembers: false
};

/**
 * Custom hook for members management data with independent filtering
 * Handles fetching and merging of active and inactive members
 */
export const useMembersManagement = () => {
	// Data States
	const [activeMembers, setActiveMembers] = useState<Member[]>([]);
	const [inactiveMembers, setInactiveMembers] = useState<Member[]>([]);
	const [membersCount, setMembersCount] = useState({
		activeMembers: 0,
		inactiveMembers: 0,
		totalMembers: 0
	});
	const [isLoading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Search and filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [memberFilter, setMemberFilters] = useState<FiltersType>(defaultFilters);
	const [opened, setOpened] = useState(false);

	const isDefaultFilterState = JSON.stringify(memberFilter) === JSON.stringify(defaultFilters);

	const loadData = useEffectEvent(async () => {
		// 1. Fetch Active Members if needed
		if (
			(memberFilter.accountStatus === "active" || memberFilter.accountStatus === "all") &&
			activeMembers.length === 0 &&
			!isLoading
		) {
			setLoading(true);
			try {
				const members = await fetchMembers({ reload: false, isActive: "active" });
				setActiveMembers(members);
				setMembersCount((prev) => ({
					...prev,
					activeMembers: members.length,
					totalMembers: members.length + prev.inactiveMembers
				}));
			} catch (err) {
				setError(err instanceof Error ? err : new Error("Unknown error"));
			} finally {
				setLoading(false);
			}
		}

		// 2. Fetch Inactive Members if needed
		const shouldFetchInactive =
			(memberFilter.accountStatus === "inactive" || memberFilter.accountStatus === "all") &&
			(inactiveMembers.length === 0 || memberFilter.latestInactiveMembers);

		if (shouldFetchInactive && !isLoading) {
			setLoading(true);
			try {
				const members = await fetchMembers({
					reload: memberFilter.latestInactiveMembers,
					isActive: "inactive"
				});
				setInactiveMembers(members);
				setMembersCount((prev) => ({
					...prev,
					inactiveMembers: members.length,
					totalMembers: prev.activeMembers + members.length
				}));
			} catch (err) {
				setError(err instanceof Error ? err : new Error("Unknown error"));
			} finally {
				setLoading(false);
			}
		}
	});

	// Data Fetching Logic
	useEffect(() => {
		loadData();
	}, [memberFilter.accountStatus, memberFilter.latestInactiveMembers]);

	// Independent refetch function
	const refetch = async () => {
		if (isLoading) return;
		setLoading(true);
		setError(null);
		try {
			// Refetch based on current view
			if (memberFilter.accountStatus === "active" || memberFilter.accountStatus === "all") {
				const members = await fetchMembers({ reload: true, isActive: "active" });
				setActiveMembers(members);
				setMembersCount((prev) => ({
					...prev,
					activeMembers: members.length,
					totalMembers: members.length + prev.inactiveMembers
				}));
			}
			if (memberFilter.accountStatus === "inactive" || memberFilter.accountStatus === "all") {
				const members = await fetchMembers({ reload: true, isActive: "inactive" });
				setInactiveMembers(members);
				setMembersCount((prev) => ({
					...prev,
					inactiveMembers: members.length,
					totalMembers: prev.activeMembers + members.length
				}));
			}
		} catch (e) {
			setError(e instanceof Error ? e : new Error("Refetch failed"));
		} finally {
			setLoading(false);
		}
	};

	const filteredMembers = useMemo(() => {
		// 1. Select the base dataset efficiently
		let baseMembers: readonly Member[];

		switch (memberFilter.accountStatus) {
			case "active":
				baseMembers = activeMembers;
				break;
			case "inactive":
				baseMembers = inactiveMembers;
				break;
			case "all":
				// Combine only when necessary
				baseMembers = [...activeMembers, ...inactiveMembers];
				break;
			default:
				baseMembers = activeMembers;
		}

		// 2. Normalize search query once outside the loop
		const normalizedQuery = searchQuery.trim().toLowerCase();

		// 3. Single-pass filtering
		return baseMembers.filter((member) => {
			// WiFi Check
			if (memberFilter.optedForWifi && !member.optedForWifi) {
				return false;
			}

			// Floor Check
			if (memberFilter.floor !== "All" && member.floor !== memberFilter.floor) {
				return false;
			}

			// Search Query Check
			if (normalizedQuery) {
				const nameMatch = member.name.toLowerCase().includes(normalizedQuery);
				const phoneMatch = member.phone.includes(normalizedQuery);
				if (!nameMatch && !phoneMatch) {
					return false;
				}
			}

			return true;
		});
	}, [
		activeMembers,
		inactiveMembers,
		memberFilter.accountStatus,
		memberFilter.floor,
		memberFilter.optedForWifi,
		searchQuery
	]);

	// Actions
	const actions = {
		setSearchQuery,
		setMemberFilters,
		setOpened,
		refetch,
		// Legacy support to keep component compatibility
		handleInactiveMembers: (checked: boolean) =>
			setMemberFilters((prev) => ({ ...prev, latestInactiveMembers: checked })),
		handleRefetch: refetch
	};

	return {
		filteredMembers,
		membersCount,
		isLoading,
		error,

		// Filter State
		searchQuery,
		memberFilter,
		opened,
		isDefaultFilterState,

		actions
	} as const;
};
