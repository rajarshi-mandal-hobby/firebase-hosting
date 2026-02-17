import { simulateNetworkDelay, simulateRandomError } from '../utils/serviceUtils';

export const createFetcher = <T>(fetchLogic: () => Promise<T>) => {
    let cache: T | null = null;
    let currentFetchPromise: Promise<T> | null = null;

    return async (refresh = false): Promise<T> => {
        if (refresh) {
            cache = null;
            currentFetchPromise = null;
        }

        if (cache) return cache;
        if (currentFetchPromise) return currentFetchPromise;

        currentFetchPromise = (async () => {
            try {
                await simulateNetworkDelay();
                simulateRandomError();
                const data = await fetchLogic();
                cache = data;
                return data;
            } finally {
                currentFetchPromise = null;
            }
        })();

        return currentFetchPromise;
    };
};

export const createKeyedFetcher = <K, T>(fetchLogic: (key: K, refresh: boolean) => Promise<T>) => {
    const cache = new Map<K, T>();
    const currentFetchPromises = new Map<K, Promise<T>>();

    // The core fetch function
    const fetch = async (key: K, refresh = false): Promise<T> => {
        if (refresh) {
            cache.delete(key);
            currentFetchPromises.delete(key);
        }

        if (cache.has(key)) return cache.get(key)!;
        if (currentFetchPromises.has(key)) return currentFetchPromises.get(key)!;

        const newPromise = (async () => {
            try {
                const data = await fetchLogic(key, refresh);
                cache.set(key, data);
                return data;
            } finally {
                currentFetchPromises.delete(key);
            }
        })();

        currentFetchPromises.set(key, newPromise);
        return newPromise;
    };

    // UTILITY: Clear all data (useful for logout or global resets)
    const clearAll = () => {
        cache.clear();
        currentFetchPromises.clear();
    };

    // Return an object containing both the function and the reset utility
    return { fetch, clearAll };
};
