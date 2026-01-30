import { Text } from '@mantine/core';
import { GlobalModal } from '../../../../stores/GlobalModal';
import { ALT_TEXT, NAVIGATE } from '../../../../../../data/types';
import { useNavigate } from 'react-router-dom';
import { useGlobalModalManager } from '../../../../stores/modal-store';

export const useActivationModal = (opened: boolean, onClose: () => void) => {
    const navigate = useNavigate();

    const { selectedMember, ...modalProps } = useGlobalModalManager('activateMember', opened, onClose);

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
        handleReactivateClick,
        ...modalProps
    };
};

interface ActivationModalProps {
    opened: boolean;
    onClose: () => void;
}

export const ActivationModal = ({ opened, onClose }: ActivationModalProps) => {
    const { selectedMember, handleReactivateClick, ...modalProps } = useActivationModal(opened, onClose);

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
            hasGlobalErrors={modalProps.hasErrors}
            hasErrorForModal={modalProps.hasErrorForModal}
            buttonDisabled={modalProps.isModalWorking}
            buttonText='Reactivate'
            resetCallback={() => {}}
            handleConfirmAction={handleReactivateClick}
        >
            <Text>
                Reactivating will take you to the member edit page for{' '}
                <strong>{selectedMember?.name.split(' ')[0] || ALT_TEXT}</strong>. The electricity bill will be
                calculated from the next month of reactivation.
            </Text>
        </GlobalModal>
    );
};
