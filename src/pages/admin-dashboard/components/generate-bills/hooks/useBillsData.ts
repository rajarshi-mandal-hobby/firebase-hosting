import type { Timestamp } from "firebase/firestore";
import { useState, useRef, useEffectEvent, useEffect } from "react";
import { useMembers, useDefaultRents } from "../../../../../contexts";
import type { Floor, Member, DefaultRents } from "../../../../../data/types";

type FunctionName = 'refetchMembers' | 'refetchDefaultRents';

interface FunctionError {
    functionName: FunctionName;
    error: Error;
}

export type GenerateBillsData = {
    billingMonths: {
        currentBillingMonth: Timestamp;
        nextBillingMonth: Timestamp;
    };
    floorIdNameMap: { [F in Floor]: { [memberId: string]: string } };
    wifiCharges: {
        wifiMemberIds: string[];
        wifiMonthlyCharge: number;
    };
    membersOptions: { value: string; label: string }[];
};

const MAX_RETRIES = 3;

export const useBillsData = () => {
    const { members, handleRefresh: refreshMembers, isLoading: membersLoading, error: membersError } = useMembers();
    const { defaultRents, isLoading: rentsLoading, error: rentsError, actions } = useDefaultRents();

    const [billingData, setBillingData] = useState<GenerateBillsData | null>(null);
    const [error, setError] = useState<FunctionError | null>(null);
    const retryCount = useRef<Record<FunctionName, number>>({ refetchMembers: 0, refetchDefaultRents: 0 });

    const processData = (fetchedMembers: Member[], rents: DefaultRents): GenerateBillsData => {
        const wifiMemberIds: string[] = [];
        const floorIdNameMap: Record<Floor, Record<string, string>> = { '2nd': {}, '3rd': {} };

        const membersOptions = fetchedMembers.map((member) => {
            if (member.optedForWifi) wifiMemberIds.push(member.id);
            floorIdNameMap[member.floor][member.id] = member.name;
            return { label: member.name, value: member.id };
        });

        console.log('Floor id map', floorIdNameMap);

        return {
            billingMonths: {
                currentBillingMonth: rents.currentBillingMonth,
                nextBillingMonth: rents.nextBillingMonth
            },
            floorIdNameMap,
            wifiCharges: { wifiMemberIds, wifiMonthlyCharge: rents.wifiMonthlyCharge },
            membersOptions
        };
    };

    const processDataEvent = useEffectEvent(() => {
        if (membersLoading || rentsLoading) return;
        setError(null);

        if (membersError || rentsError) {
            return setError({
                functionName: membersError ? 'refetchMembers' : 'refetchDefaultRents',
                error: (membersError || rentsError) as Error
            });
        }

        if (members && defaultRents) {
            setBillingData(processData(members, defaultRents));
            setError(null);
        }
    });

    // Sync external hook states to local billing data
    useEffect(() => {
        processDataEvent();
    }, [membersLoading, rentsLoading, membersError, rentsError]);

    const handleRefetch = () => {
        if (!error) return;
        const count = retryCount.current[error.functionName];

        if (count >= MAX_RETRIES) {
            return setError((prev) =>
                prev ? { ...prev, error: new Error('Max retries exceeded. Please refresh.') } : null
            );
        }

        retryCount.current[error.functionName]++;
        if (error.functionName === 'refetchMembers') refreshMembers();
        else actions.handleRefresh();
    };

    return {
        isLoading: membersLoading || rentsLoading,
        error,
        billingData,
        handleRefetch
    } as const;
};
