export const createFetcher = <T>(fetchLogic: () => Promise<T>) => {
    let cache: T | null = null;
    let persistentPromise: Promise<T> | null = null;
    let currentFetchId = 0; // Track the "generation" of the fetch

    const clearCache = () => {
        cache = null;
        persistentPromise = null;
        currentFetchId++; // Incrementing this invalidates any pending .then()
    };

    return {
        get(refresh = false) {
            if (refresh) clearCache();

            if (cache) return Promise.resolve(cache);
            if (persistentPromise) return persistentPromise;

            console.log('Fetching data');
            const fetchId = currentFetchId;

            persistentPromise = fetchLogic()
                .then((data) => {
                    // ONLY update the cache if the fetchId matches the current generation
                    // If clearCache() was called in the middle, fetchId won't match.
                    if (fetchId === currentFetchId) {
                        cache = data;
                    }
                    return data;
                })
                .finally(() => {
                    // Only clear the promise if we are still on the same generation
                    if (fetchId === currentFetchId) {
                        persistentPromise = null;
                    }
                });

            return persistentPromise;
        },
        clearCache
    };
};

export type FetcherResult<T> = {
    data: T | null;
    error: Error | null;
};
interface Fetcher<T> {
    get: (refresh?: boolean) => Promise<FetcherResult<T>>;
    clearCache: () => void;
}

export const createNewFetcher = <T>(fetchLogic: () => Promise<T>) => {
    let cache: T | null = null;
    let persistentPromise: Promise<T> | null = null;

    const clearCache = () => {
        cache = null;
        persistentPromise = null;
    };

    return {
        get(refresh = false) {
            // If we have data and aren't refreshing, return a resolved promise
            if (cache && !refresh) return Promise.resolve(cache);

            // If a fetch is already in flight, return that same promise (deduplication)
            if (persistentPromise) return persistentPromise;
            persistentPromise = fetchLogic()
                .then((data) => {
                    cache = data;
                    return cache;
                })
                .finally(() => {
                    persistentPromise = null;
                });

            return persistentPromise;
        },
        clearCache
    };
};

export const createKeyedFetcher = <K, T>(fetchLogic: (key: K) => Promise<T>) => {
    const cache = new Map<string, T>();
    const currentPromises = new Map<string, Promise<T>>();

    return async (key: K, useCache = true): Promise<T> => {
        const stringKey = JSON.stringify(key);

        if (useCache && cache.has(stringKey)) return cache.get(stringKey)!;
        if (currentPromises.has(stringKey)) return currentPromises.get(stringKey)!;

        const promise = fetchLogic(key).then((data) => {
            cache.set(stringKey, data);
            currentPromises.delete(stringKey);
            return data;
        });

        currentPromises.set(stringKey, promise);
        return promise;
    };
};
