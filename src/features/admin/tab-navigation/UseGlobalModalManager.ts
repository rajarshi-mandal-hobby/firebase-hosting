// import { useSyncExternalStore, useEffect, useRef, useEffectEvent } from "react";
// import { notifySuccess, notifyError } from "../../../shared/utils";
// import { modalStore, type ModalType } from "./modal-store";
// import type { Member } from "../../../data/types";
// import { hasErrorForModal, workingMember } from "./hooks/errorStore";

// const modalTypeMessages = {
// 	recordPayment: { success: "Recorded payment for ", error: "Error recording payment for " },
// 	addExpense: { success: "Added expense for ", error: "Error adding expense for " },
// 	deactivateMember: { success: "Deactivated ", error: "Error deactivating " },
// 	deleteMember: { success: "Deleted ", error: "Error deleting " }
// };

// export const useGlobalModalManager = (opened?: boolean, modalOpened?: ModalType, onCloseCallback?: () => void) => {
// 	// Subscribe to the global singleton
// 	const state = useSyncExternalStore(modalStore.subscribe, modalStore.getSnapshot);

// 	const wasModalWorkingRef = useRef(false);
// 	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
// 	const errorMessageRef = useRef<string | null>(null);

// 	// Actions
// 	const setModalError = <T>(
// 		memberId: string,
// 		memberName: string,
// 		modalType: ModalType,
// 		formValues: T,
// 		errorMessage: string
// 	) => {
// 		const nextCache = new Map(state.errorCache);
// 		const memberMap = new Map(nextCache.get(memberId) || []);
// 		memberMap.set(modalType, formValues);
// 		nextCache.set(memberId, memberMap);

// 		const nextNames = new Map(state.errorMemberNames);
// 		nextNames.set(memberId, memberName);

// 		errorMessageRef.current = errorMessage;
// 		modalStore.update({ errorCache: nextCache, errorMemberNames: nextNames });
// 	};

// 	const handleModalWork = async (memberId: string, callback: () => Promise<void> | void) => {
// 		if (state.isModalWorking || !state.selectedMember || state.selectedMember.id !== memberId) return;

// 		const wasOpenedAtStart = !!opened;
// 		wasModalWorkingRef.current = true;

// 		modalStore.update({
// 			workingMember: { id: state.selectedMember.id, name: state.selectedMember.name },
// 			isModalWorking: true
// 		});

// 		try {
// 			await callback();
// 		} finally {
// 			const currentCache = modalStore.getSnapshot().errorCache;
// 			const success = !currentCache.get(memberId)?.has(modalOpened!);

// 			modalStore.update({ isModalWorking: false, isSuccess: success });

// 			if (success && !wasOpenedAtStart) {
// 				notifySuccess(`${modalTypeMessages[modalOpened!].success}${state.workingMember?.name}`);
// 			} else if (!success && wasOpenedAtStart) {
// 				notifyError(`${modalTypeMessages[modalOpened!].error}${state.workingMember?.name}: ${errorMessageRef.current}`);
// 			}
// 		}
// 	};

// 	// Logic: Replaces onTick and useEffectEvent
// 	const handleStateSync = useEffectEvent(() => {
// 		if (!opened && !state.isModalWorking) {
// 			modalStore.update({ selectedMember: null, workingMember: null, isSuccess: false, openedModalName: null });
// 			if (timerRef.current) clearTimeout(timerRef.current);
// 		}

// 		if (opened && !state.isModalWorking && wasModalWorkingRef.current && state.errorCache.size === 0) {
// 			timerRef.current = setTimeout(() => {
// 				const snap = modalStore.getSnapshot();
// 				if (snap.workingMember?.id === snap.selectedMember?.id && snap.openedModalName === modalOpened) {
// 					onCloseCallback?.();
// 				}
// 				modalStore.update({ isSuccess: false });
// 				wasModalWorkingRef.current = false;
// 			}, 1500);
// 		}
// 	});

// 	useEffect(() => {
// 		handleStateSync();
// 		return () => {
// 			if (timerRef.current) clearTimeout(timerRef.current);
// 		};
// 	}, [opened, state.isModalWorking, state.errorCache.size]);

// 	return {
// 		...state,
// 		handleModalWork,
// 		setModalError,
//         workingMemberName: state.workingMember?.name,
//         hasErrorForModal: (memberId: string, type: ModalType) => state.errorCache.get(memberId)?.has(type) ?? false,
//         clearModalError: (memberId: string, type: ModalType) => modalStore.update({ errorCache: new Map(state.errorCache) }),
//         hasErrors: state.errorCache.size > 0,
//         isSuccess: state.isSuccess,
// 		// Form Helpers
// 		getFormValuesForModal: (id: string, type: ModalType) => state.errorCache.get(id)?.get(type) || {},
// 		totalErrorCount: Array.from(state.errorCache.values()).reduce((acc, m) => acc + m.size, 0),
// 		// Dynamic Name Property
// 		errorMemberName: (() => {
// 			const count = state.errorMemberNames.size;
// 			if (count === 0) return null;
// 			const names = state.errorMemberNames.values();
// 			if (count === 1) return names.next().value;
// 			return `${names.next().value.split(" ")[0]} and ${count - 1} more`;
// 		})()
// 	};
// };

// export const useGlobalManager = () => {
// 	return {
// 		onModalOpen(member: Member, modal: ModalType, openCallback: () => void) {
// 			modalStore.update({ selectedMember: member, openedModalName: modal });
// 			openCallback();
// 		},
// 		totalErrorCount: modalStore.getSnapshot().errorCache.size,
// 		hasErrorForMember: (memberId: string) => modalStore.getSnapshot().errorCache.has(memberId),
// 		hasErrorForModal: (memberId: string, type: ModalType) => modalStore.getSnapshot().errorCache.get(memberId)?.has(type) ?? false
// 	};
// };

