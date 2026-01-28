import { useNavigate } from "react-router-dom";
import { NAVIGATE } from "../../../../../data/types";
import { useGlobalModalManager } from "../../../../admin/stores/modal-store";

export const useActivationModal = (opened: boolean, onClose: () => void) => {
	const navigate = useNavigate();

	const { selectedMember } = useGlobalModalManager(opened, "activateMember", onClose);

	const handleReactivateClick = () => {
		onClose();
		if (selectedMember) {
			navigate(NAVIGATE.REACTIVATE_MEMBER.path, {
				state: { member: selectedMember, action: NAVIGATE.REACTIVATE_MEMBER.action }
			});
		}
	};

	return {
		selectedMember,
		handleReactivateClick
	};
};
