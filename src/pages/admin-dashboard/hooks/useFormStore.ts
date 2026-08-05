import { useSyncExternalStore } from 'react';

const deliminator = ':';

export const FORM_ID_NAME_MAP = {
    record_payment: 'Payment Form',
    add_expense: 'Expense Form',
    delete_member: 'Delete Form',
    deactivate_member: 'Deactivate Form',
    reactivate_member_modal: 'Activate Member',
    default_rents: 'Default Rents',
    generate_bills: 'Generate Bills'
} as const;

export type FormKey = keyof typeof FORM_ID_NAME_MAP;
export type FormName = (typeof FORM_ID_NAME_MAP)[FormKey];

const GlobalFormNames = new Set<FormName>(['Default Rents', 'Generate Bills']);

interface MemberContext {
    memberId: string;
    memberName: string;
}

export interface FormStateEntry<T = any> {
    draft: T;
    formName: string;
    isPending: boolean;
    hasError: boolean;
    memberContext?: MemberContext;
}

type FormStates = Record<string, FormStateEntry>;

// The complete snapshot shape React will listen to
export interface FormStoreSnapshot {
    entries: FormStates;
    hasErrors: boolean;
    isGlobalPending: boolean;
    isMemberActionPending: boolean;
    errorFormNames: string[];
}

const getCompoundId = (key: FormKey, memberId?: string | null) => (memberId ? key + deliminator + memberId : key);

interface Store {
    subscribe(listener: VoidFunction): VoidFunction;
    getSnapshot(): FormStoreSnapshot;
    onFormSubmit<T>(values: T, key: FormKey, memberContext: MemberContext | null): void;
    onFormError(key: FormKey, memberId: string | null): void;
    clearFormState(key: FormKey, memberId: string | null): void;
    clearFormStates(): void;
}

let currentSnapshot: FormStoreSnapshot = {
    entries: {},
    hasErrors: false,
    isGlobalPending: false,
    isMemberActionPending: false,
    errorFormNames: []
};

const listeners = new Set<VoidFunction>();
const emitChange = () => listeners.forEach((l) => l());

const calculateNextSnapshot = (nextEntries: FormStates): FormStoreSnapshot => {
    const values = Object.values(nextEntries);
    const isGlobalPending = values.some((item) => GlobalFormNames.has(item.formName as FormName) && item.isPending);
    const isMemberActionPending = values.some(
        (item) => !GlobalFormNames.has(item.formName as FormName) && item.isPending
    );
    const hasErrors = values.some((item) => item.hasError);
    const errorFormNames =
        hasErrors ?
            values.filter((item) => item.hasError).map((item) => item.memberContext?.memberName ?? item.formName)
        :   [];

    return {
        entries: nextEntries,
        isGlobalPending,
        isMemberActionPending,
        hasErrors,
        errorFormNames
    };
};

const store: Store = {
    subscribe(listener) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    getSnapshot(): FormStoreSnapshot {
        return currentSnapshot;
    },

    onFormSubmit(values, key, memberContext) {
        const compoundId = getCompoundId(key, memberContext?.memberId);

        const nextEntries = {
            ...currentSnapshot.entries,
            [compoundId]: {
                ...currentSnapshot.entries[compoundId],
                draft: values,
                formName: FORM_ID_NAME_MAP[key],
                isPending: true,
                memberContext: memberContext ?? undefined
            }
        };

        console.log('next entries', nextEntries);

        currentSnapshot = calculateNextSnapshot(nextEntries);
        emitChange();
    },

    onFormError(key, memberId) {
        const compoundId = getCompoundId(key, memberId);

        if (currentSnapshot.entries[compoundId]) {
            const nextEntries = {
                ...currentSnapshot.entries,
                [compoundId]: {
                    ...currentSnapshot.entries[compoundId],
                    isPending: false,
                    hasError: true
                }
            };

            currentSnapshot = calculateNextSnapshot(nextEntries);
            emitChange();
        }
    },

    clearFormState(key, memberId) {
        const compoundId = getCompoundId(key, memberId ?? undefined);

        if (currentSnapshot.entries[compoundId]) {
            const nextEntries = { ...currentSnapshot.entries };
            delete nextEntries[compoundId];

            currentSnapshot = calculateNextSnapshot(nextEntries);
            emitChange();
        }
    },

    clearFormStates() {
        currentSnapshot = {
            entries: {},
            hasErrors: false,
            isGlobalPending: false,
            isMemberActionPending: false,
            errorFormNames: []
        };
        emitChange();
    }
};

// --- OPTIMIZED TYPESAFE REACT HOOK ---
export const useFormStore = <T = any>() => {
    // React automatically tracks the nested properties here
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

    return {
        // Correctly reactive derived data
        hasErrors: snapshot.hasErrors,
        errorFormNames: snapshot.errorFormNames,
        isGlobalPending: snapshot.isGlobalPending,

        // Actions
        onFormSubmit: store.onFormSubmit,
        onFormError: store.onFormError,
        clearFormState: store.clearFormState,
        clearFormStates: store.clearFormStates,

        // Dynamic lookups (safely using snapshot reference)
        hasMemberErrorForForm(key: FormKey, memberId: string) {
            const id = getCompoundId(key, memberId);
            return !!snapshot.entries[id]?.hasError;
        },

        retrieveFormState(key: FormKey, memberId: string | null) {
            const id = getCompoundId(key, memberId ?? undefined);
            return snapshot.entries[id] as FormStateEntry<T> | undefined;
        },

        getFormName(key: FormKey) {
            return FORM_ID_NAME_MAP[key] as FormName;
        }
    };
};
