import { useState, useEffect, useRef, useEffectEvent } from "react";
import { fetchDefaultValues } from "../../../../data/services/defaultsService";
import type { DefaultValues } from "../../../../data/types";

export const useDefaultRents = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [defaultValues, setDefaultValues] = useState<DefaultValues | null>(null);
	const [refetch, setRefetch] = useState(false);
	const refetchCountRef = useRef(0);

	const fetchEvent = useEffectEvent(() => {
		const shouldFetch = !defaultValues || refetch;

		if (!shouldFetch || isLoading) {
			return;
		}

		const fetchSettings = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const data = await fetchDefaultValues(refetch);
				setDefaultValues(data);
				refetchCountRef.current = 0; // Reset retry count on success
			} catch (error) {
				setError(error as Error);
				refetchCountRef.current++; // Increment retry count on failure
			} finally {
				setIsLoading(false);
				if (refetch) {
					setRefetch(false);
				}
			}
		};

		fetchSettings();
	});

	useEffect(() => {
		fetchEvent();
	}, [refetch]);

	const handleRefresh = () => {
		if (refetchCountRef.current >= 3) {
			throw new Error("Maximum retry attempts reached for fetching settings. Refresh the page to try again.");
		}
		setRefetch(true);
	};

	return { defaultValues, isLoading, error, actions: { handleRefresh } };
};
