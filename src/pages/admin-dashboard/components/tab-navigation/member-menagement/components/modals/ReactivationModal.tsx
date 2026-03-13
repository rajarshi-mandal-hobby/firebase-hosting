import { Text } from '@mantine/core';
import { ALT_TEXT } from '../../../../../../../data/types';
import { GlobalModal } from '../../../../../../../shared/components/GlobalModal';
import { useMyNavigation } from '../../../../../../../shared/hooks/useNavigation';
import { useGlobalErrorData } from '../../../../../../../contexts';
import type { GlobalModalProps } from '../../../../../../../shared/components/GlobalModal';
import { useActivityMountedKey } from '../../../../../../../shared/hooks';

export const useReactivationModal = ({ onClose }: GlobalModalProps) => {
    const { hasErrorForSelectedMember, selectedMember } = useGlobalErrorData();
    const { navigateTo } = useMyNavigation();
    const key = useActivityMountedKey('member-management-activity');

    const handleReactivateClick = () => {
        if (!selectedMember) return;
        onClose();
        navigateTo('member-action', { memberid: selectedMember.id, action: 'reactivate-member' });
    };

    return {
        selectedMember,
        handleReactivateClick,
        hasErrorForSelectedMember: hasErrorForSelectedMember(),
        key
    };
};

export function ReactivationModal({ opened, onClose }: GlobalModalProps) {
    const { selectedMember, handleReactivateClick, hasErrorForSelectedMember, key } = useReactivationModal({
        opened,
        onClose
    });

    console.log('Rendering Activation Modal');

    return (
        <GlobalModal
            opened={opened}
            onClose={onClose}
            modalTitle='Reactivate Member'
            isPending={false}
            showButtons
            buttonText='Reactivate'
            onHandleConfirmAction={handleReactivateClick}
            hasErrorForMemeber={hasErrorForSelectedMember}
            key={key}
        >
            <Text>
                Reactivating will take you to the member edit page for{' '}
                <strong>{selectedMember?.name.split(' ')[0] || ALT_TEXT}</strong>. The electricity bill will be
                calculated from the next month of reactivation.
            </Text>
        </GlobalModal>
    );
}
