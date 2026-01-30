import {
    type TransitionFunction,
    useState,
    useTransition,
    useEffectEvent,
    useEffect,
} from "react";
import type { Member } from "../../../../data/types";

export interface ModalActions {
    selectedMember: Member | null;
    workingMemberName: string | null;
    isModalWorking: boolean;
    handleModalOpen: (member: Member, openModalCallback: () => void) => void;

    handleModalWork: (memberName: string, callback: TransitionFunction) => void;
    clearMemberAfterWork: () => void;
}

export const useModalActions = (isModalOpen: boolean): ModalActions => {
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [workingMemberName, setWorkingMemberName] = useState<string | null>(
        null,
    );
    const [isModalWorking, startModalWork] = useTransition();

    const handleModalOpen = (member: Member, openModalCallback: () => void) => {
        setSelectedMember(member);
        openModalCallback();
    };

    const handleModalWork = (
        memberName: string,
        callback: TransitionFunction,
    ) => {
        setWorkingMemberName(memberName);
        startModalWork(callback);
    };

    const clearMemberAfterWork = () => {
        if (isModalWorking) return;
        if (selectedMember) setSelectedMember(null);
        if (workingMemberName) setWorkingMemberName(null);
    };

    // Clear member only when modal is not open and has finished working
    const clearMemberAfterWrokEvent = useEffectEvent(() => {
        if (!isModalWorking && !isModalOpen) clearMemberAfterWork();
    });

    useEffect(() => {
        clearMemberAfterWrokEvent();
    }, [isModalWorking, isModalOpen]);

    return {
        selectedMember,
        workingMemberName,
        isModalWorking,
        handleModalOpen,
        handleModalWork,
        clearMemberAfterWork,
    };
};
