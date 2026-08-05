import { useEffect, useEffectEvent, useSyncExternalStore, useTransition } from 'react';
import { rentsAndBillsStore } from './stores/rentsAndBillsStore';

export const useRentsAndBills = () => {
    const snapshot = useSyncExternalStore(rentsAndBillsStore.subscribe, rentsAndBillsStore.getSnapshot);
    const [loading, startTransition] = useTransition();

    const fetchEvnt = useEffectEvent(async () => {
        if (loading || !!snapshot.rentsAndBills) return;
        await rentsAndBillsStore.triggerFetch();
    });

    useEffect(() => {
        startTransition(async () => await fetchEvnt());
    }, []);

    return {
        rentsAndBills: snapshot.rentsAndBills,
        loading,
        error: snapshot.error,
        resetStore: rentsAndBillsStore.resetStore,
        refetch: rentsAndBillsStore.refetch
    } as const;
};
