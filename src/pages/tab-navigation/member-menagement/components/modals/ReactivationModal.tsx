import { Button, Stack, Text } from '@mantine/core';
import { closeModal } from '@mantine/modals';
import { doc, deleteField } from 'firebase/firestore';
import { startTransition } from 'react';
import { type Member, DB } from '../../../../../data/types';
import { db, runTransactionWrapper } from '../../../../../firebase';
import { MyLoadingOverlay, ErrorAlert, GroupButtons } from '../../../../../shared/components';
import { IconPersonCheck } from '../../../../../shared/icons';
import { notifyLoading, notifySuccess, notifyError, getMemberFirstname } from '../../../../../shared/utils';
import { useFormStore } from '../../../../admin-dashboard/hooks/useFormStore';
import type { MemberManagementModalProps } from './types/member-management-modal';

const useReactivationModal = (member: Member) => {
    const memberId = member.id;
    const memberName = member.name;
    const { isGlobalPending, onFormError, onFormSubmit, retrieveFormState, clearFormState } = useFormStore<string>();
    const formState = retrieveFormState('reactivate_member_modal', memberId);
    const hasError = !!formState?.hasError;
    const isPending = !!formState?.isPending || isGlobalPending;
    const clearFormStateFn = () => clearFormState('reactivate_member_modal', memberId);

    const actions = {
        handleClearError() {
            clearFormStateFn();
        },
        handleCloseModal() {
            closeModal(memberId);
        },
        handleReactivate() {
            const firstname = getMemberFirstname(memberName);
            const notifyId = notifyLoading(`Reactivating ${firstname}...`);

            onFormSubmit('', 'reactivate_member_modal', { memberId, memberName });

            startTransition(async () => {
                await runTransactionWrapper(
                    async (t) => {
                        t.update(doc(db, DB.memberCol, memberId), {
                            isActive: true,
                            leaveDate: deleteField()
                        });

                        notifySuccess('Member reactivated successfully', {
                            id: notifyId,
                            update: true
                        });
                        actions.handleClearError();
                        actions.handleCloseModal();
                    },
                    (error) => {
                        onFormError('reactivate_member_modal', memberId);
                        notifyError(error.message, {
                            id: notifyId,
                            update: true,
                            title: `${formState?.formName}: ${memberName}`
                        });
                    }
                );
            });
        }
    };

    return {
        isPending,
        hasError,
        actions
    };
};

export const ReactivationModal = ({ member }: MemberManagementModalProps) => {
    const {
        hasError,
        isPending,
        actions: { handleCloseModal, handleReactivate, handleClearError }
    } = useReactivationModal(member);

    return (
        <Stack pos='relative' p={4}>
            <MyLoadingOverlay visible={isPending} />

            <ErrorAlert
                message="Couldn't reactivate, please try again."
                visible={hasError}
                withCloseButton
                onClose={handleClearError}
                variant='outline'
            />

            <Text>
                Are you sure you want to reactivate <strong>{member.name}</strong>?
            </Text>

            <GroupButtons>
                <Button variant='default' onClick={handleCloseModal}>
                    Close
                </Button>
                <Button onClick={handleReactivate} disabled={isPending} leftSection={<IconPersonCheck />}>
                    {isPending ? 'Reactivating...' : 'Reactivate'}
                </Button>
            </GroupButtons>
        </Stack>
    );
};
