import { createContext, use, useEffect, useEffectEvent, useReducer, useState } from 'react';
import type { DefaultRents } from '../data/types';
import { fetchDefaultRents } from '../services';
import { MaxRetryError } from '../shared/components';

interface State {
    isLoading: boolean;
    error: Error | null;
    defaultRents: DefaultRents | null;
    refetch: boolean;
    refetchCount: number;
}

interface Action {
    type: 'success' | 'error' | 'loading' | 'refetch';
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
                refetch: false
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
        refetch: false
    });

    const fetchDefaultValuesEvent = useEffectEvent(async () => {
        if (!loadData || state.isLoading) return;

        const shouldFetch = state.refetch || (!state.defaultRents && !state.error);
        if (!shouldFetch) return;

        dispatch({ type: 'loading' });
        try {
            const data = await fetchDefaultRents(state.refetch);
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
    }, [state.refetch, loadData]); // Triggers when refetched OR when first 'activated'

    return {
        ...state,
        actions: {
            handleRefresh: () => dispatch({ type: 'refetch' })
        }
    };
};

// 2. Define the Context Type properly
type DefaultRentsContextType = ReturnType<typeof useFetchDefaultRents> & {
    activate: () => void;
};

const DefaultRentsContext = createContext<DefaultRentsContextType | null>(null);

// 3. Update the Provider
export const DefaultRentsProvider = ({ children }: { children: React.ReactNode }) => {
    const [hasRequested, setHasRequested] = useState(false);

    // We pass the "lazy" flag into your hook
    const hookValues = useFetchDefaultRents(hasRequested);

    // Stable activation function
    const activate = () => setHasRequested(true);

    // Merge hook values with activate function
    const contextValue = {
        ...hookValues,
        activate
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
        context.activate();
    }, [context]);

    return context;
};
