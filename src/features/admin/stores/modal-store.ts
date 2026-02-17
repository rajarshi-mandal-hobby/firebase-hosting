import { useEffect, useEffectEvent, useRef, useSyncExternalStore } from 'react';
import { type Member } from '../../../data/types';
import { notifyLoading, notifyUpdate, notifyClose } from '../../../shared/utils';

// --- Types & Store (Stay the same) ---
export type ModalType = 'recordPayment' | 'addExpense' | 'deactivateMember' | 'deleteMember' | 'activateMember';

interface GlobalModalState {
    errorCache: Map<string, Map<ModalType, any>>;
    errorMemberNames: Map<string, string>;
    selectedMember: Member | null;
    workingMember: { id: string | null; name: string | null; isWorking: boolean; isSuccess: boolean };
    openedModalName: ModalType | null;
}

let state: GlobalModalState = {
    errorCache: new Map(),
    errorMemberNames: new Map(),
    selectedMember: null,
    workingMember: { id: null, name: null, isWorking: false, isSuccess: false },
    openedModalName: null
};

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
};

const modalStore = {
    subscribe,
    getSnapshot: () => state,
    update: (next: Partial<GlobalModalState>) => {
        const changed = Object.entries(next).some(([key, value]) => state[key as keyof GlobalModalState] !== value);
        if (!changed) return;

        state = { ...state, ...next };
        listeners.forEach((l) => l());
    }
};

const useModalSelector = <T>(selector: (state: GlobalModalState) => T): T =>
    useSyncExternalStore(modalStore.subscribe, () => selector(modalStore.getSnapshot()));

// --- Hook 1: Modal Operations ---
export const globalModalMessages = {
    recordPayment: (name: string, errorMessage?: string | null) => ({
        success: `Successfully recorded payment for ${name}`,
        error: `Failed to record payment for ${name}${errorMessage ? `: ${errorMessage}` : ''}`
    }),
    addExpense: (name: string, errorMessage?: string | null) => ({
        success: `Successfully added expense for ${name}`,
        error: `Failed to add expense for ${name}${errorMessage ? `: ${errorMessage}` : ''}`
    }),
    deactivateMember: (name: string, errorMessage?: string | null) => ({
        success: `Successfully deactivated ${name}`,
        error: `Failed to deactivate ${name}${errorMessage ? `: ${errorMessage}` : ''}`
    }),
    deleteMember: (name: string, errorMessage?: string | null) => ({
        success: `Successfully deleted ${name}`,
        error: `Failed to delete ${name}${errorMessage ? `: ${errorMessage}` : ''}`
    }),
    activateMember: (name: string, errorMessage?: string | null) => ({
        success: `Successfully activated ${name}`,
        error: `Failed to activate ${name}${errorMessage ? `: ${errorMessage}` : ''}`
    })
};

export const useGlobalModalManager = (modalOpened: ModalType, opened: boolean, onCloseCallback: () => void) => {
    const isModalOpenedRef = useRef(opened);
    isModalOpenedRef.current = opened;

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const errorMessageRef = useRef<string | null>(null);

    const globalModalStore = useModalSelector((s) => (opened ? s : null));

    const selectedMember = globalModalStore?.selectedMember;
    const workingMember = globalModalStore?.workingMember;
    const errorCache = globalModalStore?.errorCache;
    const errorMemberNames = globalModalStore?.errorMemberNames;
    const openedModalName = globalModalStore?.openedModalName;

    const errorMemberName = (() => {
        if (!errorMemberNames) return null;
        const count = errorMemberNames.size;
        if (!count) return null;
        const name = errorMemberNames.get(selectedMember?.id || '');
        if (name) return name;
        if (count === 1) return errorMemberNames.values().next().value || null;
        return `${errorMemberNames.values().next().value?.split(' ')[0]} and ${count - 1} more`;
    })();

    // --- Actions ---
    const setModalError = <T>(formValues: T, errorMessage: string) => {
        const memberId = selectedMember?.id;
        const memberName = selectedMember?.name;
        const modalType = openedModalName;
        if (!memberId || !memberName || !modalType) return;
        console.log(memberId, memberName, modalType);
        const nextCache = new Map(errorCache);
        const memberMap = new Map(nextCache.get(memberId) || []);
        memberMap.set(modalType, formValues);
        nextCache.set(memberId, memberMap);

        const nextNames = new Map(errorMemberNames);
        nextNames.set(memberId, memberName);
        modalStore.update({ errorCache: nextCache, errorMemberNames: nextNames });

        errorMessageRef.current = errorMessage;
    };

    const clearModalError = () => {
        const modal = openedModalName;
        const memberId = selectedMember?.id;
        if (!modal || !memberId) return;
        const nextCache = new Map(errorCache);
        const nextNames = new Map(errorMemberNames);

        if (!modal) {
            nextCache.delete(memberId);
            nextNames.delete(memberId);
        } else {
            const memberMap = new Map(nextCache.get(memberId) || []);
            memberMap.delete(modal);
            if (memberMap.size > 0) {
                nextCache.set(memberId, memberMap);
            } else {
                nextCache.delete(memberId);
                nextNames.delete(memberId);
            }
        }
        modalStore.update({ errorCache: nextCache, errorMemberNames: nextNames });

        errorMessageRef.current = null;
    };

    const handleModalWork = async (callback: () => Promise<void> | void) => {
        if (!selectedMember || (workingMember && workingMember.isWorking)) return;

        modalStore.update({
            workingMember: { id: selectedMember.id, name: selectedMember.name, isWorking: true, isSuccess: false }
        });

        const loadingNotification = notifyLoading(`Processing for ${selectedMember.name}...`);

        try {
            await callback();
        } finally {
            const snap = modalStore.getSnapshot();
            const success = !snap.errorCache.get(selectedMember.id)?.has(modalOpened);

            if (isModalOpenedRef.current && success) {
                notifyClose(loadingNotification);
            } else {
                const msg = globalModalMessages[modalOpened](snap.workingMember.name || '');
                notifyUpdate(loadingNotification, success ? msg.success : errorMessageRef.current || msg.error, {
                    type: success ? 'success' : 'error'
                });
            }

            modalStore.update({ workingMember: { ...snap.workingMember, isWorking: false, isSuccess: success } });
        }
    };

    // --- Sync/Timer Logic ---
    const clearAndAutoClose = useEffectEvent(() => {
        // If state is null, get the snapshot
        const autoClearSnap = modalStore.getSnapshot();
        // Cleanup on close
        if (!opened && autoClearSnap.selectedMember !== null) {
            console.log('Clearing modal');
            modalStore.update({
                selectedMember: null,
                openedModalName: null,
                workingMember: {
                    ...autoClearSnap.workingMember,
                    isSuccess: false
                }
            });
            if (timerRef.current) clearTimeout(timerRef.current);
        }

        // Auto-close if successful for THIS specific modal
        const isSameModal = autoClearSnap.openedModalName === modalOpened;
        if (opened && isSameModal && autoClearSnap.workingMember.isSuccess) {
            console.log('Closing modal');
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                const snap = modalStore.getSnapshot();
                if (
                    snap.workingMember &&
                    snap.workingMember.id === snap.selectedMember?.id &&
                    snap.openedModalName === modalOpened
                ) {
                    onCloseCallback?.();
                }
                modalStore.update({
                    workingMember: {
                        id: null,
                        name: null,
                        isWorking: false,
                        isSuccess: false
                    }
                });
            }, 1500);
        }
    });

    useEffect(() => {
        clearAndAutoClose();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [opened, workingMember?.isSuccess]);

    const hasErrorForMember = selectedMember?.id ? !!errorCache?.has(selectedMember.id) : false;
    const hasErrorForModal = selectedMember?.id ? !!errorCache?.get(selectedMember.id)?.has(modalOpened) : false;
    const getCachedFormValues = <T>(): T => {
        if (!selectedMember || !errorCache) return {} as T;
        const cachedValues = errorCache.get(selectedMember.id)?.get(modalOpened);
        if (!cachedValues) return {} as T;
        return cachedValues as T;
    };

    return {
        selectedMember: selectedMember ?? null,
        isModalWorking: !!workingMember?.isWorking,
        isSuccess: !!workingMember?.isSuccess,
        workingMemberName: workingMember?.name ?? null,
        hasGlobalErrors: !!errorCache?.size,
        errorMemberName,
        handleModalWork,
        setModalError,
        clearModalError,
        hasErrorForModal,
        getCachedFormValues,
        hasErrorForMember
    };
};

export const useGlobalModal = () => {
    const totalErrorCount = useModalSelector((state) => [...state.errorCache.values()].flat().length);

    const onModalOpen = (member: Member, modal: ModalType, openCallback: () => void) => {
        modalStore.update({ selectedMember: member, openedModalName: modal });
        openCallback();
    };

    const useHasErrorForMember = (memberId: string) => useModalSelector((state) => state.errorCache.has(memberId));

    const useHasErrorForModal = (memberId: string | undefined, type: ModalType) =>
        useModalSelector((state) => (memberId ? (state.errorCache.get(memberId)?.has(type) ?? false) : false));

    const errorMemberName = useModalSelector((state) => {
        const count = state.errorMemberNames.size;
        if (!count) return null;
        const name = state.errorMemberNames.get(state.selectedMember?.id || '');
        if (name) return name;
        if (count === 1) return state.errorMemberNames.values().next().value || null;
        return `${[...state.errorMemberNames.values()][count - 1]?.split(' ')[0]} and ${count - 1} more`;
    });

    return {
        // Return data directly
        totalErrorCount,
        // Return stable references
        onModalOpen,
        useHasErrorForMember,
        useHasErrorForModal,
        errorMemberName
    };
};
