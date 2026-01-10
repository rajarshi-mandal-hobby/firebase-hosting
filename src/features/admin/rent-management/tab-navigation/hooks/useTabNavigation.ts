import { startTransition, useMemo, useState } from "react";

export type Tab = "rent" | "members";
export type ModalType = "recordPayment" | "addExpense";
export interface ModalErrorProps<T> {
	isError: boolean;
	type: ModalType;
	memberId: string;
    formValues: T;
}

 const useFormErrorCache = <T>() => {
    const [errorCache, setErrorCache] = useState<Map<string, T>>(new Map());

    const hasErrorCache = (memberId?: string): boolean => {
        if (!memberId) return false;
        return errorCache.size > 0 && errorCache.has(memberId);
    };

    const removeErrorCache = (memberId: string) => {
        setErrorCache((prev) => {
            const prevMap = new Map(prev);
            prevMap.delete(memberId);
            return prevMap;
        });
    };

    const addErrorCache = (memberId: string, values: T) => {
        setErrorCache((prev) => {
            const prevMap = new Map(prev);
            prevMap.set(memberId, values);
            return prevMap;
        });
    };

    return {
        errorCache,
        removeErrorCache,
        addErrorCache,
        hasErrorCache
    };
};

export const useTabNavigation = () => {
	const [activeTab, setActiveTab] = useState<Tab>("rent");
	const [modalErrors, setModalErrors] = useState<Map<ModalType, Set<string>>>(new Map());
	const formErrorCache = useFormErrorCache();

	const setModalError = <T>({ isError, type, memberId, formValues }: ModalErrorProps<T>) => {
		console.log("setModalError", isError, type, memberId);
		setModalErrors((prev) => {
			const updatedSet = new Set(prev.get(type));
			if (isError) {
				updatedSet.add(memberId);
                formErrorCache.addErrorCache(memberId, formValues);
				return new Map(prev).set(type, updatedSet);
                
			} else {
				if (updatedSet.has(memberId)) {
					updatedSet.delete(memberId);
                    formErrorCache.removeErrorCache(memberId);
					return new Map(prev).set(type, updatedSet);
				}
				return prev;
			}
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
