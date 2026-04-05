import { createContext, use, useActionState, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import type { SaveResult } from '../data/types';
import { httpsCallable } from 'firebase/functions';
import { simulateNetworkDelay } from '../data/utils/serviceUtils';
import { functions } from '../firebase';
import { notifySuccess, notifyError } from '../shared/utils';
import type { Member } from '../data/types';

const FormKeys = {
    'default-rents': 'saveDefaultRents',
    'record-payment': 'recordPayment',
    'add-expense': 'addExpense',
    'add-member': 'addMember',
    'edit-member': 'editMember',
    'delete-member': 'deleteMember',
    'deactivate-member': 'deactivateMember',
    'reactivate-member': 'reactivateMember',
    'generate-bills': 'generateBill'
} as const;

type FormKey = keyof typeof FormKeys;

export const FormNames = {
    'default-rents': 'Default Rents',
    'record-payment': 'Record Payment',
    'add-expense': 'Add Expense',
    'add-member': 'Add Member',
    'edit-member': 'Edit Member',
    'delete-member': 'Delete Member',
    'deactivate-member': 'Deactivate Member',
    'reactivate-member': 'Reactivate Member',
    'generate-bills': 'Generate Bill'
} as const;

const listeners = new Set<() => void>();

interface FormState<T> {
    isPending: boolean;
    saveResult: SaveResult | null;
    values: T | null;
    error: string | null;
    membercontext: { id: string; name: string } | null;
}

let storeFormState: Record<string, FormState<any>> = {};

const StoreInitialState: FormState<any> = {
    isPending: false,
    saveResult: null,
    values: null,
    error: null,
    membercontext: null
} as const;

interface MemberErrorInfo {
    name: string;
    id: string;
    forms: Record<string, boolean>;
    errorCount: number;
}

let storeGlobalErrorData = {
    errorCount: 0,
    errorMembers: {} as Record<string, MemberErrorInfo>
};

// Pure O(n) scan only when a status actually changes
const updateGlobalCache = () => {
    const nextMembers: Record<string, MemberErrorInfo> = {};
    let totalErrors = 0;

    Object.entries(storeFormState).forEach(([internalKey, state]) => {
        const hasError = !!(state.error || (state.saveResult && !state.saveResult.success));
        if (!hasError || !state.membercontext) return;

        const { id, name } = state.membercontext;
        const baseKey = internalKey.split('#')[0];

        if (!nextMembers[id]) {
            nextMembers[id] = { id, name, forms: {}, errorCount: 0 };
        }

        if (!nextMembers[id].forms[baseKey]) {
            nextMembers[id].forms[baseKey] = true;
            nextMembers[id].errorCount++;
            totalErrors++;
        }
    });

    // Update the global reference so useSyncExternalStore detects the change
    storeGlobalErrorData = {
        errorCount: totalErrors,
        errorMembers: nextMembers
    };
};

let storeSelectedMember: Member | null = null;

const formStateStore = {
    subscribe: (cb: () => void) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
    },
    getFormStateSnapshot: () => storeFormState,
    getGlobalErrorDataSnapshot: () => storeGlobalErrorData,
    getSelectedMemberSnapshot: () => storeSelectedMember,

    setResult: <T,>(key: string, state: Partial<FormState<T>>) => {
        const prevState = storeFormState[key] || StoreInitialState;
        const nextState = { ...prevState, ...state };

        storeFormState = { ...storeFormState, [key]: nextState };

        const prevErr = !!(prevState.error || (prevState.saveResult && !prevState.saveResult.success));
        const nextErr = !!(nextState.error || (nextState.saveResult && !nextState.saveResult.success));

        // Logic Gate: Only rebuild the error map if an error status toggled
        if (prevErr !== nextErr) {
            updateGlobalCache();
        }

        listeners.forEach((l) => l());
    },

    setSelectedMember: (member: Member | null) => {
        storeSelectedMember = member;
        listeners.forEach((l) => l());
    },

    resetKey: (key: string) => {
        if (!storeFormState[key]) return;
        const nextStore = { ...storeFormState };
        delete nextStore[key];
        storeFormState = nextStore;
        updateGlobalCache();
        listeners.forEach((l) => l());
    },

    resetAll: () => {
        storeFormState = {};
        storeGlobalErrorData = { errorCount: 0, errorMembers: {} };
        storeSelectedMember = null;
        listeners.forEach((l) => l());
    }
};

const FormStateContext = createContext<typeof formStateStore | null>(null);

export const FormStoreProvider = ({ children }: { children: ReactNode }) => (
    <FormStateContext value={formStateStore}>{children}</FormStateContext>
);

// HOOKS
export const useGlobalFormStore = <T,>(key: FormKey) => {
    const store = use(FormStateContext)!;
    if (!store) throw new Error('FormStoreProvider is not wrapped around the component');

    const selectedMember = useSyncExternalStore(store.subscribe, store.getSelectedMemberSnapshot);
    const internalKey = selectedMember ? `${key}#${selectedMember.id}` : key;

    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const state = useSyncExternalStore(
        store.subscribe,
        () => store.getFormStateSnapshot()[internalKey] as FormState<T> | undefined
    );

    const dispatcher = async (values: T) => {
        if (!isMountedRef.current) return;

        const currentMember = selectedMember;
        const currentMemberName = currentMember?.name;
        store.setResult(internalKey, {
            isPending: true,
            saveResult: null,
            values,
            error: null,
            membercontext: currentMember
        });

        try {
            const fn = httpsCallable(functions, FormKeys[key]);
            const res = await fn(values);
            const saveResult = res.data as unknown as SaveResult;

            store.setResult(internalKey, {
                isPending: false,
                values,
                saveResult,
                error: null,
                membercontext: currentMember
            });

            if (saveResult.success) {
                notifySuccess(`Saved ${FormNames[key]}`, { title: currentMemberName });
            } else {
                notifyError(`Check ${FormNames[key]} errors`, { title: currentMemberName });
            }
        } catch (e) {
            const error = (e as Error).message;
            store.setResult(internalKey, {
                isPending: false,
                saveResult: null,
                values,
                error,
                membercontext: currentMember
            });
            notifyError(`Failed: ${error}`, { title: currentMemberName });
        }
    };

    return {
        state: state || (StoreInitialState as FormState<T>),
        selectedMember,
        dispatcher,
        onResetState: () => store.resetKey(internalKey)
    };
};

export const useGlobalErrorData = () => {
    const store = use(FormStateContext);
    if (!store) throw new Error('useGlobalErrorData must be used within a StoreProvider');

    const { errorCount, errorMembers } = useSyncExternalStore(store.subscribe, store.getGlobalErrorDataSnapshot);
    const selectedMember = useSyncExternalStore(store.subscribe, store.getSelectedMemberSnapshot);

    return {
        selectedMember,
        setSelectedMember: store.setSelectedMember,
        hasGlobalErrors: errorCount > 0,
        errorCount,
        errorMembers,
        hasErrorForMember: (memberId: string | null | undefined) => (memberId ? !!errorMembers[memberId] : false),
        hasErrorForSelectedMember: () => (selectedMember?.id ? !!errorMembers[selectedMember.id] : false),
        hasErrorForMemberAndForm: (memberId: string | null | undefined, formKey: FormKey) =>
            memberId ? !!errorMembers[memberId]?.forms[formKey] : false,
        resetAll: store.resetAll
    };
};
