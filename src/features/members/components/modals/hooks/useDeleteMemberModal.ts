import { useState, useEffectEvent, useEffect } from "react";
import { simulateNetworkDelay } from "../../../../../data/utils/serviceUtils";
import { useGlobalModalManager } from "../../../../admin/stores/modal-store";

export const useDeleteMemberModal = (opened: boolean, onClose: () => void) => {
	const [confirmationText, setConfirmationText] = useState("");
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const {
		selectedMember,
		isModalWorking,
		handleModalWork,
		clearModalError,
		setModalError,
		workingMemberName,
		isSuccess,
		errorMemberName,
		hasErrors,
		hasErrorForModal
	} = useGlobalModalManager(opened, "deleteMember", onClose);

	const openedEvent = useEffectEvent(() => {
		if (!opened) return;
		setConfirmationText("");
		setDeleteError(null);
	});

	useEffect(() => {
		openedEvent();
	}, [opened]);

	const hasError = hasErrorForModal(selectedMember?.id ?? "", "deleteMember");

	const handleErrorReset = () => {
		if (!selectedMember) return;
		setDeleteError(null);
		setConfirmationText("");
		clearModalError(selectedMember.id, "deleteMember");
	};

	const setConfirmationTextHandler = (text: string) => {
		setConfirmationText(text);
		if (deleteError) setDeleteError(null);
	};

	const handleDelete = async () => {
		if (confirmationText !== "DELETE") {
			setDeleteError("Must type 'DELETE' exactly");
			return;
		}

		if (!selectedMember || isModalWorking) return;

		try {
			await handleModalWork(selectedMember.id, async () => {
				await simulateNetworkDelay(500);
				clearModalError(selectedMember.id, "deleteMember");
			});
		} catch (error) {
			setModalError(selectedMember.id, selectedMember.name, "deleteMember", confirmationText, (error as Error).message);
		}
	};
	return {
		selectedMember,
		isModalWorking,
		workingMemberName,
		isSuccess,
		errorMemberName,
		hasErrors,
		hasError,
		handleErrorReset,
		handleDelete,
		confirmationText,
		deleteError,
		setConfirmationTextHandler
	};
};
