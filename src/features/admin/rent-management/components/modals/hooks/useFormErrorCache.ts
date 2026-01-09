import { useState } from "react";

export const useFormErrorCache = <T>() => {
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