import { Modal, Space, Button, Text } from "@mantine/core";
import { GroupButtons } from "../../../../shared/components";
import { useActivationModal } from "./hooks/useActivationModal";

interface ActivationModalProps {
	opened: boolean;
	onClose: () => void;
}

export const ActivationModal = ({ opened, onClose }: ActivationModalProps) => {

	const { selectedMember, handleReactivateClick } = useActivationModal(opened, onClose);

	console.log("Rendering Activation Modal");

	return (
		<Modal opened={opened} onClose={onClose} title='Reactivate Member' size='sm'>
			{selectedMember && (
				<>
					<Text fw={500} fz='lg'>
						{selectedMember.name}
					</Text>
					<Space h='md' />
					<Text>
						Reactivating will take you to the member edit page for{" "}
						<strong>{selectedMember.name.split(" ")[0]}</strong>. The electricity bill will be calculated from the
						next month of reactivation.
					</Text>
					<GroupButtons>
						<Button variant='white' onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={handleReactivateClick}>Reactivate</Button>
					</GroupButtons>
				</>
			)}
		</Modal>
	);
};
