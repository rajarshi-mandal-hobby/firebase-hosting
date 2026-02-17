import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { DefaultRents } from '../../types';
import { fetchDefaultRents } from '../defaultRentService';

export const useDefaultRents = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [defaultRents, setDefaultRents] = useState<DefaultRents | null>(null);
    const [refetch, setRefetch] = useState(false);
    const refetchCountRef = useRef(0);

    const fetchDefaultValuesEvent = useEffectEvent(async () => {
        if (isLoading) return;
        const shouldFetch = refetch || (!defaultRents && !error);
        if (!shouldFetch) return;

        setIsLoading(true);
        setError(null);
        try {
            if (refetchCountRef.current > 3) {
                throw new Error(
                    'Maximum retry attempts reached for fetching Default Rents. Refresh the page to try again.'
                );
            }

            const data = await fetchDefaultRents(refetch);
            setDefaultRents(data);
            refetchCountRef.current = 0;
        } catch (error) {
            setError(error as Error);
            refetchCountRef.current += 1;
        } finally {
            setIsLoading(false);
            setRefetch(false);
        }
    });

    useEffect(() => {
        fetchDefaultValuesEvent();
    }, [refetch]);

    return {
        defaultRents,
        isLoading,
        error,
        actions: {
            handleRefresh: () => setRefetch(true)
        }
    };
};
