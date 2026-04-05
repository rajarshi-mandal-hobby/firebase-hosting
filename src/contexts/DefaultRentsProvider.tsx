import {
    createContext,
    startTransition,
    use,
    useEffect,
    useEffectEvent,
    useReducer,
    useRef,
    useState,
    useTransition
} from 'react';
import { DEFAULT_RENTS, type DefaultRents, type ReactChildren } from '../data/types';
import { fetchDefaultRents, fetchDefaultRentsWithCache } from '../services';
import { MaxRetryError } from '../shared/components';
import type { FetcherResult } from '../services/fetcherFactories';
import { doc, getDoc } from 'firebase/firestore';
import { value } from 'valibot';
import { db } from '../firebase';
import { simulateRandomError } from '../data/utils/serviceUtils';

interface State {
    isLoading: boolean;
    error: Error | null;
    defaultRents: DefaultRents | null;
    refetch: boolean;
    refetchCount: number;
    isCacheCleared: boolean;
}

interface Action {
    type: 'success' | 'error' | 'loading' | 'refetch' | 'clearCache';
    payload?: DefaultRents | Error | null;
}

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'loading':
            return {
                ...state,
                isLoading: true,
                error: null,
                defaultRents: null,
                refetch: false,
                isCacheCleared: false
            };
        case 'success':
            return {
                ...state,
                isLoading: false,
                defaultRents: action.payload as DefaultRents,
                refetchCount: 0
            };
        case 'error':
            return {
                ...state,
                isLoading: false,
                error: action.payload as Error,
                defaultRents: null
            };

        case 'refetch':
            return {
                ...state,
                refetch: true,
                refetchCount: state.refetchCount + 1
            };
        case 'clearCache':
            return {
                ...state,
                defaultRents: null,
                error: null, // Clear error too
                isLoading: false,
                isCacheCleared: true,
                refetch: false
            };

        default:
            return { ...state };
    }
};

// 1. Update the Hook to handle the "Lazy" loadData flag
const useFetchDefaultRents = (loadData: boolean) => {
    const [state, dispatch] = useReducer(reducer, {
        isLoading: false,
        error: null,
        defaultRents: null,
        refetchCount: 0,
        refetch: false,
        isCacheCleared: false
    });

    const fn = fetchDefaultRents;

    const fetchDefaultValuesEvent = useEffectEvent(async () => {
        const shouldFetch = state.refetch || state.isCacheCleared || (!state.defaultRents && !state.error);

        if (!shouldFetch) return;

        dispatch({ type: 'loading' });
        try {
            const data = await fn.get(state.refetch);
            dispatch({ type: 'success', payload: data });
        } catch (error) {
            const isMaxRetry = state.refetchCount >= 3;
            dispatch({
                type: 'error',
                payload: isMaxRetry ? MaxRetryError : (error as Error)
            });
        }
    });

    useEffect(() => {
        fetchDefaultValuesEvent();
    }, [state.refetch, loadData]);

    return {
        ...state,
        actions: {
            handleRefresh: () => dispatch({ type: 'refetch' }),
            clearCache: () => {
                fn.clearCache();
                dispatch({ type: 'clearCache' });
            }
        }
    };
};

// 2. Define the Context Type properly
type DefaultRentsContextType = ReturnType<typeof useFetchDefaultRents> & {
    activateFetch: () => void;
};

const DefaultRentsContext = createContext<DefaultRentsContextType | null>(null);

// 3. Update the Provider
export const DefaultRentsProvider = ({ children }: { children: React.ReactNode }) => {
    const [hasRequested, setHasRequested] = useState(false);
    const hookValues = useFetchDefaultRents(hasRequested);

    // Wrap the hook's clearCache to also flip the local toggle
    const clearCacheAndStop = () => {
        hookValues.actions.clearCache(); // Clears the singleton/reducer
        setHasRequested(false); // Stops the useEffect trigger
    };

    const contextValue = {
        ...hookValues,
        activateFetch: () => setHasRequested(true),
        actions: {
            ...hookValues.actions,
            clearCache: clearCacheAndStop
        }
    };

    return <DefaultRentsContext value={contextValue}>{children}</DefaultRentsContext>;
};

// 4. Update the Consumer Hook
export const useDefaultRents = () => {
    const context = use(DefaultRentsContext);
    if (!context) {
        throw new Error('useDefaultRents must be used within DefaultRentsProvider');
    }

    // This triggers the first fetch only when a component actually uses the hook
    useEffect(() => {
        context.activateFetch();
    }, [context, context.isCacheCleared]);

    return context;
};

export type RentsResult =
    | {
          success: true;
          data: DefaultRents | null;
      }
    | { success: false; error: Error };

export interface RentsContextType {
    promise: () => Promise<RentsResult>;
    clearCache: () => void;
}

const RentsContext = createContext<RentsContextType | null>(null);

export const RentsProvider = ({ children }: ReactChildren) => {
    const cache = useRef<Promise<RentsResult> | null>(null);

    const promise = () => {
        if (!cache.current) {
            const newPromise: Promise<RentsResult> = (async () => {
                try {
                    const docRef = doc(db, DEFAULT_RENTS.COL, DEFAULT_RENTS.DOC);
                    const docSnapshot = await getDoc(docRef);
                    simulateRandomError();
                    return docSnapshot.exists() ?
                            { success: true, data: docSnapshot.data() as DefaultRents }
                        :   { success: true, data: null };
                } catch (error) {
                    return { success: false, error: error as Error };
                }
            })();

            cache.current = newPromise;
        }

        return cache.current;
    };

    const clearCache = () => {
        cache.current = null;
    };

    return <RentsContext value={{ promise, clearCache }}>{children}</RentsContext>;
};

export const useRents = (): RentsContextType => {
    const context = use(RentsContext);
    if (!context) {
        throw new Error('useRents must be used within RentsProvider');
    }
    return context;
};
