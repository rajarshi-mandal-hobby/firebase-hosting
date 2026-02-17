import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ErrorBoundary, ErrorContainer, LoadingBox, MyAlert, SuspenseBox } from '../../../../shared/components';
import { IconInfo } from '../../../../shared/icons';
import { useDefaultRents } from '../../../../data/services/hooks/useDefaultRents';
import { DefaultRentsForm } from './DefaultRentsForm';
import type { SaveResult } from '../../../../data/shemas/formResults';
import { notifyError, notifySuccess } from '../../../../shared/utils';
import { simulateNetworkDelay } from '../../../../data/utils/serviceUtils';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../firebase';

const DefaultRentsContainer = () => {
    const {
        defaultRents,
        isLoading,
        error,
        actions: { handleRefresh }
    } = useDefaultRents();

    console.log('🎨 Rendering DefaultRentsContainer');

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        // The document was never created
        if (error.cause === 'default-rents-missing') {
            return (
                <>
                    <MyAlert color='orange' title='Default Values missing' Icon={IconInfo}>
                        Please add default values to continue...
                    </MyAlert>
                    <DefaultRentsForm defaultRents={null} onRefresh={handleRefresh} />
                </>
            );
        }
        // Return error container for other errors
        return <ErrorContainer error={error} onRetry={handleRefresh} />;
    }

    if (defaultRents) {
        return <DefaultRentsForm defaultRents={defaultRents} onRefresh={handleRefresh} />;
    }
};

export const DefaultRentsPage = () => {
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <ErrorBoundary onRetry={() => setRefreshKey((prev) => prev + 1)}>
            <SuspenseBox>
                <DefaultRentsContainer key={refreshKey} />
            </SuspenseBox>
        </ErrorBoundary>
    );
    // return <MantineSignupForm />;
};

const FormKeys = {
    'default-rents': 'saveDefaultRents',
    'record-payment': 'recordPayment'
} as const;
type FormKey = keyof typeof FormKeys;

const getSuccessMessage = (key: FormKey) => {
    switch (key) {
        case 'default-rents':
            return 'Default Rents saved successfully';
        case 'record-payment':
            return 'Payment recorded successfully';
        default:
            return 'Success';
    }
};
const getErrorMessage = (key: FormKey, message: string) => {
    switch (key) {
        case 'default-rents':
            return `Error saving Default Rents: ${message}`;
        case 'record-payment':
            return `Error recording payment: ${message}`;
        default:
            return 'Error';
    }
};
const getFormErrorMessage = (key: FormKey) => {
    switch (key) {
        case 'default-rents':
            return 'Default Rents has form errors';
        case 'record-payment':
            return 'Payment has form errors';
        default:
            return 'Error';
    }
};
const listeners = new Set<() => void>();
interface FormState<T> {
    isPending: boolean;
    saveResult: SaveResult | null;
    values: T;
    error: string | null;
    memberContext: { name: string; id: string } | null;
}
let storeFormState: Record<string, FormState<any>> = {};

const getInitialState = <T,>(): FormState<T> => ({
    isPending: false,
    saveResult: null,
    values: {} as T, // Cast to T for internal consistency
    error: null,
    memberContext: null
});

const formStateStore = {
    subscribe: (cb: () => void) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
    },
    getSnapshot: () => storeFormState,
    getGlobalErrorCount: () => {
        return Object.values(storeFormState).filter((f) => f.error !== null || (f.saveResult && !f.saveResult.success))
            .length;
    },
    setResult: <T,>(key: FormKey, state: Partial<FormState<T>>) => {
        storeFormState = {
            ...storeFormState,
            [key]: { ...(storeFormState[key] || getInitialState<T>()), ...state }
        };
        listeners.forEach((l) => l());
    },
    resetKey: <T,>(key: FormKey) => {
        storeFormState = {
            ...storeFormState,
            [key]: getInitialState<T>()
        };
        listeners.forEach((l) => l());
    }
};

const FormStateContext = createContext<typeof formStateStore | null>(null);

export const FormStoreProvider = ({ children }: { children: ReactNode }) => {
    return <FormStateContext value={formStateStore}>{children}</FormStateContext>;
};

export const useFormStore = <T,>(key: FormKey, memberContext: { name: string; id: string } | null = null) => {
    const store = useContext(FormStateContext);
    if (!store) throw new Error('useFormStore must be used within a StoreProvider');

    const getSelectedSnapshot = () => store.getSnapshot()[key];
    const state = useSyncExternalStore(store.subscribe, getSelectedSnapshot) as FormState<T> | undefined;

    const dispatcher = async (values: T) => {
        store.setResult(key, { isPending: true, saveResult: null, values, error: null, memberContext });

        try {
            await simulateNetworkDelay(5000);
            const fn = httpsCallable(functions, FormKeys[key]);
            const res = await fn(values);
            const saveResult = res.data as unknown as SaveResult;

            store.setResult(key, {
                isPending: false,
                values,
                saveResult,
                error: null,
                memberContext
            });

            if (saveResult.success) {
                notifySuccess(getSuccessMessage(key));
            } else {
                notifyError(getFormErrorMessage(key));
            }
        } catch (error) {
            store.setResult(key, {
                isPending: false,
                saveResult: null,
                values,
                error: (error as Error).message
            });
            notifyError(getErrorMessage(key, (error as Error).message));
        }
    };

    return {
        // FIX: Return the stable initial state constant
        state: state || getInitialState<T>(),
        dispatcher,
        resetState: () => store.resetKey<T>(key)
    };
};

export const useGlobalErrorCount = () => {
    const store = useContext(FormStateContext);
    if (!store) throw new Error('useGlobalErrorCount must be used within a StoreProvider');

    return useSyncExternalStore(store.subscribe, () => store.getGlobalErrorCount());
};

export const useMemberFormError = (formKey: string, memberId: string) => {
    const store = useContext(FormStateContext);
    if (!store) throw new Error('useMemberFormError must be used within a StoreProvider');

    return useSyncExternalStore(store.subscribe, () => {
        const entry = store.getSnapshot()[formKey];

        // Match both the specific key and the specific member
        const hasError =
            entry &&
            entry.memberContext?.id === memberId &&
            (entry.error !== null || (entry.saveResult && !entry.saveResult.success));

        if (!hasError) return null;

        return {
            message: entry.error || 'Validation Error',
            values: entry.values
        };
    });
};

