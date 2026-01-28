import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { type Member } from "../../../data/types";
import { notifySuccess, notifyError } from "../../../shared/utils";

// --- Types & Store (Stay the same) ---
export type ModalType = "recordPayment" | "addExpense" | "deactivateMember" | "deleteMember" | "activateMember";

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

export const modalStore = {
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
export const modalTypeMessages = {
	recordPayment: (name: string, errorMessage?: string | null) => ({
		success: `Successfully recorded payment for ${name}`,
		error: `Failed to record payment for ${name}${errorMessage ? `: ${errorMessage}` : ""}`
	}),
	addExpense: (name: string, errorMessage?: string | null) => ({
		success: `Successfully added expense for ${name}`,
		error: `Failed to add expense for ${name}${errorMessage ? `: ${errorMessage}` : ""}`
	}),
	deactivateMember: (name: string, errorMessage?: string | null) => ({
		success: `Successfully deactivated ${name}`,
		error: `Failed to deactivate ${name}${errorMessage ? `: ${errorMessage}` : ""}`
	}),
	deleteMember: (name: string, errorMessage?: string | null) => ({
		success: `Successfully deleted ${name}`,
		error: `Failed to delete ${name}${errorMessage ? `: ${errorMessage}` : ""}`
	}),
	activateMember: (name: string, errorMessage?: string | null) => ({
		success: `Successfully activated ${name}`,
		error: `Failed to activate ${name}${errorMessage ? `: ${errorMessage}` : ""}`
	})
};

export const useGlobalModalManager = (opened: boolean, modalOpened: ModalType, onCloseCallback: () => void) => {
	// Subscribe to the global singleton
	const state = useModalSelector((state) => (opened && state.openedModalName === modalOpened ? state : null));
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const errorMessageRef = useRef<string | null>(null);
	const [triggerAutoClose, setTriggerAutoClose] = useState(false);
	// Required to show notifications if the modal is not opened
	const isModalOpenedRef = useRef(false);

	const errorMemberName = useMemo(() => {
		if (!state) return null;
		const count = state.errorMemberNames.size;
		if (!count) return null;
		const name = state.errorMemberNames.get(state.selectedMember?.id || "");
		if (name) return name;
		if (count === 1) return state.errorMemberNames.values().next().value || null;
		return `${state.errorMemberNames.values().next().value?.split(" ")[0]} and ${count - 1} more`;
	}, [state]);

	// --- Actions ---
	const setModalError = <T>(
		memberId: string,
		memberName: string,
		modalType: ModalType,
		formValues: T,
		errorMessage: string
	) => {
		if (!state) return;
		const nextCache = new Map(state.errorCache);
		const memberMap = new Map(nextCache.get(memberId) || []);
		memberMap.set(modalType, formValues);
		nextCache.set(memberId, memberMap);

		const nextNames = new Map(state.errorMemberNames);
		nextNames.set(memberId, memberName);
		modalStore.update({ errorCache: nextCache, errorMemberNames: nextNames });

		errorMessageRef.current = errorMessage;
	};

	const clearModalError = (memberId: string, modal?: ModalType) => {
		if (!state) return;
		const nextCache = new Map(state.errorCache);
		const nextNames = new Map(state.errorMemberNames);

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

	const handleModalWork = async (memberId: string, callback: () => Promise<void> | void) => {
		if (!state) return;
		const { isWorking } = state.workingMember;
		if (isWorking || !state.selectedMember || state.selectedMember.id !== memberId) return;

		modalStore.update({
			workingMember: { id: state.selectedMember.id, name: state.selectedMember.name, isWorking: true, isSuccess: false }
		});
		setTriggerAutoClose(true);

		try {
			await callback();
		} finally {
			const snap = modalStore.getSnapshot();
			const { name } = snap.workingMember;
			const success = !snap.errorCache.get(memberId)?.has(modalOpened!);
			// Will hold the modal type as it is an async operation
			const modalType = modalOpened!;

			// Show notification only if the modal is not opened
			if (success && !isModalOpenedRef.current) {
				notifySuccess(modalTypeMessages[modalType](name!).success);
			} else if (!success) {
				notifyError(
					!isModalOpenedRef.current ?
						modalTypeMessages[modalType](name!, errorMessageRef.current).error
					:	errorMessageRef.current || "Something went wrong"
				);
			}

			modalStore.update({
				workingMember: {
					...snap.workingMember,
					isWorking: false,
					isSuccess: success
				}
			});
			setTriggerAutoClose(false);
		}
	};

	// --- Sync/Timer Logic ---
	const onTick = useEffectEvent(() => {
		if (!state) onCloseCallback?.();

		// If state is null, get the snapshot
		const currentState = state ? state : modalStore.getSnapshot();
		// Cleanup on close
		if (!opened) {
			modalStore.update({
				selectedMember: null,
				openedModalName: null,
				workingMember: {
					...currentState.workingMember,
					isSuccess: false
				}
			});
			if (timerRef.current) clearTimeout(timerRef.current);
		}

		// Auto-close if successful for THIS specific modal
		const isSameModal = currentState.openedModalName === modalOpened;
		if (opened && isSameModal && currentState.workingMember.isSuccess) {
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
		isModalOpenedRef.current = opened;
		onTick();
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [opened, triggerAutoClose]);

	const hasErrorForMember = (id: string) => !!state?.errorCache.has(id);
	const hasErrorForModal = (id: string, type: ModalType) => !!state?.errorCache.get(id)?.has(type);
	const getFormValuesForModal = <T>(id: string, type: ModalType): T =>
		state?.errorCache.get(id)?.get(type) || ({} as T);

	return {
		...state,
		isModalWorking: state ? state.workingMember.isWorking : false,
		isSuccess: state ? state.workingMember.isSuccess : false,
		workingMemberName: state?.workingMember.name || null,
		hasErrors: !!state?.errorCache.size,
		errorMemberName,
		handleModalWork,
		setModalError,
		clearModalError,
		hasErrorForModal,
		getFormValuesForModal,
		hasErrorForMember
	};
};

export const useGlobalManager = () => {
	const totalErrorCount = useModalSelector((state) => [...state.errorCache.values()].flat().length);

	const onModalOpen = (member: Member, modal: ModalType, openCallback: () => void) => {
		modalStore.update({ selectedMember: member, openedModalName: modal });
		openCallback();
	};

	const useHasErrorForMember = (memberId: string) => useModalSelector((state) => state.errorCache.has(memberId));

	const useHasErrorForModal = (memberId: string | undefined, type: ModalType) =>
		useModalSelector((state) => (memberId ? (state.errorCache.get(memberId)?.has(type) ?? false) : false));

	return {
		// Return data directly
		totalErrorCount,
		// Return stable references
		onModalOpen,
		useHasErrorForMember,
		useHasErrorForModal
	};
};
