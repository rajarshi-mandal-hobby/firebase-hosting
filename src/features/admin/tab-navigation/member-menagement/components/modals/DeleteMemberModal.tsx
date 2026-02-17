import { TextInput, Alert } from '@mantine/core';
import { IconClose } from '../../../../../../shared/icons';
import { displayPhoneNumber } from '../../../../../../shared/utils';
import { useState, useEffectEvent, useEffect } from 'react';
import { simulateNetworkDelay } from '../../../../../../data/utils/serviceUtils';
import { useGlobalModalManager } from '../../../../stores/modal-store';
import { GlobalModal } from '../../../../stores/GlobalModal';

export const useDeleteMemberModal = (opened: boolean, onClose: () => void) => {
    const [confirmationText, setConfirmationText] = useState('');
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
        hasGlobalErrors,
        hasErrorForModal
    } = useGlobalModalManager('deleteMember', opened, onClose);

    const openedEvent = useEffectEvent(() => {
        if (!opened) return;
        setConfirmationText('');
        setDeleteError(null);
    });

    useEffect(() => {
        openedEvent();
    }, [opened]);

    const handleErrorReset = () => {
        if (!selectedMember) return;
        setDeleteError(null);
        setConfirmationText('');
        clearModalError();
    };

    const setConfirmationTextHandler = (text: string) => {
        setConfirmationText(text);
        if (deleteError) setDeleteError(null);
    };

    const handleDelete = async () => {
        if (confirmationText !== 'DELETE') {
            setDeleteError("Must type 'DELETE' exactly");
            return;
        }

        if (!selectedMember || isModalWorking) return;

        try {
            await handleModalWork(async () => {
                await simulateNetworkDelay(500);
                clearModalError();
            });
        } catch (error) {
            setModalError(confirmationText, (error as Error).message);
        }
    };
    return {
        selectedMember,
        isModalWorking,
        workingMemberName,
        isSuccess,
        errorMemberName,
        hasGlobalErrors,
        hasErrorForModal,
        handleErrorReset,
        handleDelete,
        confirmationText,
        deleteError,
        setConfirmationTextHandler
    };
};

interface DeleteMemberModalProps {
    opened: boolean;
    onClose: () => void;
}

export function DeleteMemberModal({ opened, onClose }: DeleteMemberModalProps) {
    const {
        selectedMember,
        isModalWorking,
        workingMemberName,
        isSuccess,
        errorMemberName,
        hasGlobalErrors,
        hasErrorForModal,
        handleErrorReset,
        handleDelete,
        confirmationText,
        deleteError,
        setConfirmationTextHandler
    } = useDeleteMemberModal(opened, onClose);

    console.log('Rendering Delete Member Modal');

    return (
        <GlobalModal
            opened={opened}
            onClose={onClose}
            modalTitle='Delete Member'
            modalType='deleteMember'
            selectedMemberName={selectedMember?.name || null}
            memberDescription={displayPhoneNumber(selectedMember?.phone || '0000000000')}
            isModalWorking={isModalWorking}
            isSuccess={isSuccess}
            workingMemberName={workingMemberName}
            errorMemberName={errorMemberName}
            hasGlobalErrors={hasGlobalErrors}
            hasErrorForModal={hasErrorForModal}
            buttonDisabled={isModalWorking || !!deleteError}
            buttonText='Delete'
            buttonProps={{ color: 'red' }}
            resetCallback={handleErrorReset}
            handleConfirmAction={handleDelete}
            showButtons
        >
            <TextInput
                label='Permanently delete this member?'
                description={
                    !deleteError && confirmationText !== 'DELETE' ? 'Type DELETE to confirm permanent deletion'
                    : confirmationText === 'DELETE' ?
                        'Are you sure?'
                    :   null
                }
                value={confirmationText}
                onChange={(event) => setConfirmationTextHandler(event.currentTarget.value)}
                error={deleteError}
                inputWrapperOrder={['label', 'input', 'description', 'error']}
                rightSection={confirmationText && <IconClose onClick={() => setConfirmationTextHandler('')} />}
                required
            />

            {/* Warning Alert */}
            <Alert color='red' title='Warning'>
                This action will permanently delete this member and all associated data. This action cannot be undone.
            </Alert>
        </GlobalModal>
    );
};
