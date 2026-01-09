import { startTransition, useMemo, useState } from "react";

export type Tab = "rent" | "members";
export type ModalType = "recordPayment" | "addExpense";
export interface ModalErrorProps {
	isError: boolean;
	type: ModalType;
	memberId: string;
}

export const useTabNavigation = () => {
	const [activeTab, setActiveTab] = useState<Tab>("rent");
	const [modalErrors, setModalErrors] = useState<Map<ModalType, Set<string>>>(new Map());

	const setModalError = ({ isError, type, memberId }: ModalErrorProps) => {
		console.log("setModalError", isError, type, memberId);
		setModalErrors((prev) => {
			const next = new Map(prev);
			const updatedSet = new Set(next.get(type));
			if (isError) {
				updatedSet.add(memberId);
			} else {
				updatedSet.delete(memberId);
			}
			console.log("setModalError", next);
			return next.set(type, updatedSet);
		});
	};

	const hasModalErrorForMember = (memberId: string, type?: ModalType) => {
		if (type) return modalErrors.get(type)?.has(memberId) ?? false;
		// Use for...of for faster iteration
		const sets = modalErrors.values();
		for (const set of sets) {
			if (set.has(memberId)) return true;
		}
		return false;
	};

	const hasModalErrors = useMemo(() => {
		const sets = modalErrors.values();
		for (const set of sets) {
			if (set.size > 0) return true;
		}
		return false;
	}, [modalErrors]);

	const handleTabChange = (tab: string) => startTransition(() => setActiveTab(tab as Tab));

	return {
		activeTab,
		handleTabChange,
		modalErrors,
		setModalError,
		hasModalErrorForMember,
		hasModalErrors
	};
};
