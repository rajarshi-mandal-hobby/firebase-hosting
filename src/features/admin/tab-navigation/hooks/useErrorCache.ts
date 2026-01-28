import { useState } from "react";

export type Modal = "recordPayment" | "addExpense" | "deactivateMember" | "deleteMember";

export interface UseErrorCache {
	errorCache: Map<string, Map<Modal, any>>;
	setModalError: <T>(memberId: string, memberName: string, type: Modal, formValues: T) => void;
	clearModalError: (memberId: string, type?: Modal) => void;
	hasErrorCacheForMember: (memberId: string, modalTypes?: Modal[]) => boolean;
	hasModalErrors: () => boolean;
	getModalError: <T>(memberId: string, type: Modal) => T;
	getErrorMemberName: () => string | null;
}

export const useErrorCache = (): UseErrorCache => {
	const [errorCache, setErrorCache] = useState<Map<string, Map<Modal, any>>>(new Map());
	const [errorMemberName, setErrorMemberName] = useState<Set<string>>(new Set());

	const setModalError = <T>(memberId: string, memberName: string, type: Modal, formValues: T) => {
		setErrorCache((prev) => {
			const next = new Map(prev);
			const memberMap = new Map(next.get(memberId) || []);
			memberMap.set(type, { memberName, formValues });
			next.set(memberId, memberMap);
			return next;
		});
		setErrorMemberName((prev) => {
			const next = new Set(prev);
			next.add(memberName);
			return next;
		});
	};

	const clearModalError = (memberId: string, modal?: Modal) => {
		const prevIdMap = errorCache.get(memberId);
		// Early return if member doesn't exist
		if (!prevIdMap) return;
		const next = new Map(errorCache);
		if (!modal) {
			next.delete(memberId);
			if (next.size === 0) {
				setErrorMemberName(new Set());
			}
			setErrorCache(next);
			return;
		}

		const modalMap = new Map(next.get(memberId) || []);
		modalMap.delete(modal);

		// If modal map is empty, delete the member else update the modal map
		if (modalMap.size > 0) {
			next.set(memberId, modalMap);
		} else {
			next.delete(memberId);
		}

		const nextMemberName = modalMap.values().next().value?.memberName;
		if (!nextMemberName) setErrorMemberName(new Set());
		else
			setErrorMemberName((prev) => {
				const next = new Set(prev);
				next.delete(nextMemberName);
				return next;
			});
		setErrorCache(next);
	};

	const getErrorMemberName = () => {
		return errorMemberName.values().next().value ?? null;
	};

	const hasErrorCacheForMember = (memberId: string, modalTypes?: Modal[]): boolean => {
		const memberErrorMap = errorCache.get(memberId);
		if (!memberErrorMap) return false;
		if (!modalTypes) return true;
		return modalTypes.some((type) => memberErrorMap.has(type));
	};

	const hasModalErrors = () => errorCache.size > 0;

	/**
	 * Always check if the member ID exist with hasErrorCacheForMember to get a valid value
	 */
	const getModalError = <T>(memberId: string, type: Modal): T => {
		const formValues = errorCache.get(memberId)?.get(type);
		if (!formValues) return {} as T;
		return formValues as T;
	};

	return {
		errorCache,
		getErrorMemberName,
		setModalError,
		clearModalError,
		getModalError,
		hasModalErrors,
		hasErrorCacheForMember
	};
};
