import { Text } from '@mantine/core';
import { GlobalModal } from '../../../../stores/GlobalModal';
import { ALT_TEXT } from '../../../../../../data/types';
import { useGlobalModalManager } from '../../../../stores/modal-store';
import { useNavigation } from '../../../../pages/AdminDashboard';

interface ActivationModalProps {
    opened: boolean;
    onClose: () => void;
}

export const useActivationModal = ({ opened, onClose }: ActivationModalProps) => {
    const { selectedMember, ...modalProps } = useGlobalModalManager('activateMember', opened, onClose);
    const { navigateTo } = useNavigation();

    const handleReactivateClick = () => {
        if (!selectedMember) return;
        onClose();
        navigateTo('addMember', { memberid: selectedMember.id, action: 'reactivate' });
    };

    return {
        selectedMember,
        handleReactivateClick,
        ...modalProps
    };
};

export function ActivationModal({ opened, onClose }: ActivationModalProps) {
    const { selectedMember, handleReactivateClick, ...modalProps } = useActivationModal({
        opened,
        onClose
    });

    console.log('Rendering Activation Modal');

    return (
        <GlobalModal
            opened={opened}
            onClose={onClose}
            modalTitle='Reactivate Member'
            modalType='activateMember'
            selectedMemberName={selectedMember?.name ?? null}
            isModalWorking={modalProps.isModalWorking}
            isSuccess={modalProps.isSuccess}
            workingMemberName={modalProps.workingMemberName}
            errorMemberName={modalProps.errorMemberName}
            hasGlobalErrors={modalProps.hasGlobalErrors}
            hasErrorForModal={modalProps.hasErrorForModal}
            buttonDisabled={modalProps.isModalWorking}
            buttonText='Reactivate'
            resetCallback={() => {}}
            handleConfirmAction={handleReactivateClick}
            showButtons
        >
            <Text>
                Reactivating will take you to the member edit page for{' '}
                <strong>{selectedMember?.name.split(' ')[0] || ALT_TEXT}</strong>. The electricity bill will be
                calculated from the next month of reactivation.
            </Text>
        </GlobalModal>
    );
}
