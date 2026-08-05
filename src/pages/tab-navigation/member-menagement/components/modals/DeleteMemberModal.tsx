import { Stack, TextInput, VisuallyHidden, Button, Text, List, ListItem } from '@mantine/core';
import { useForm } from '@mantine/form';
import { startTransition } from 'react';
import { closeAllModals } from '@mantine/modals';
import type { MemberManagementModalProps } from './types/member-management-modal';
import { httpsCallable } from 'firebase/functions';
import { type Member } from '../../../../../data/types';
import { functions } from '../../../../../firebase';
import { MyLoadingOverlay, ErrorAlert, MyAlert, GroupButtons } from '../../../../../shared/components';
import { notifyLoading, notifySuccess, notifyError, getMemberFirstname } from '../../../../../shared/utils';
import { useFormStore } from '../../../../admin-dashboard/hooks/useFormStore';
import type { FirebaseError } from 'firebase/app';
import { IconDelete } from '../../../../../shared/icons';

interface DeleteMemberFormValues {
    confirmationText: string;
    memberId: string;
}

export const useDeleteMemberModal = (member: Member) => {
    const memberId = member.id;
    const memberName = member.name;
    const { isGlobalPending, onFormSubmit, onFormError, clearFormState, retrieveFormState, getFormName } =
        useFormStore<DeleteMemberFormValues>();
    const formState = retrieveFormState('delete_member', memberId);
    const isPending = !!formState?.isPending || isGlobalPending;
    const hasError = !!formState?.hasError;
    const handleClearFormState = () => clearFormState('delete_member', memberId);

    const form = useForm<DeleteMemberFormValues>({
        initialValues: { confirmationText: '', memberId },
        validate: {
            confirmationText: (val) => (val.trim() && val !== 'DELETE' ? 'Must type DELETE exactly' : null),
            memberId: (val) => (!val || val !== member.id ? 'Member ID is required' : null)
        }
    });

    const saveDb = async (values: DeleteMemberFormValues) => {
        onFormSubmit(values, 'delete_member', { memberId, memberName });
        const firstname = getMemberFirstname(memberName);
        const notifyId = notifyLoading(`Deleting ${firstname}`);
        const callableFn = httpsCallable(functions, 'deleteMember');

        try {
            await callableFn(values);

            handleClearFormState();
            notifySuccess(`Deleted ${firstname}!`, { id: notifyId, update: true });
            closeAllModals();
        } catch (error) {
            onFormError('delete_member', memberId);
            notifyError((error as FirebaseError).message, {
                id: notifyId,
                update: true,
                title: getFormName('delete_member') + ': ' + firstname
            });
        }
    };

    return {
        form,
        isPending,
        hasError,
        handleDelete(values: DeleteMemberFormValues) {
            startTransition(async () => saveDb(values));
        },
        resetForm() {
            form.reset();
            handleClearFormState();
        }
    };
};

export function DeleteMemberModal({ member }: MemberManagementModalProps) {
    const { form, isPending, hasError, handleDelete, resetForm } = useDeleteMemberModal(member);

    console.log('Rendering Delete Member Modal');

    return (
        <form onSubmit={form.onSubmit(handleDelete, () => notifyError('Check form errors!'))}>
            <Stack gap='lg' pos='relative'>
                <MyLoadingOverlay visible={isPending} />

                <ErrorAlert message='Error while deleting!' visible={hasError} withCloseButton onClose={resetForm} />

                <TextInput
                    autoComplete='off'
                    label={`Permanently delete ${member.name}?`}
                    description={
                        !form.errors.confirmationText && form.values.confirmationText !== 'DELETE' ?
                            'Type DELETE to confirm permanent deletion'
                        : form.values.confirmationText === 'DELETE' ?
                            'Are you sure?'
                        :   null
                    }
                    inputWrapperOrder={['label', 'input', 'description', 'error']}
                    required
                    key={form.key('confirmationText')}
                    {...form.getInputProps('confirmationText')}
                />

                <VisuallyHidden>
                    <TextInput
                        size='xs'
                        variant='unstyled'
                        readOnly
                        required
                        key={form.key('memberId')}
                        {...form.getInputProps('memberId')}
                    />
                </VisuallyHidden>

                {form.errors.memberId && (
                    <Text c='red'>
                        <span style={{ fontWeight: 700 }}>Error:</span> {form.errors.memberId}
                    </Text>
                )}

                {/* Warning Alert */}
                <MyAlert color='red' title='Warning' iconName='warning'>
                    <List size='sm'>
                        <ListItem>
                            All the data will be automatically deleted after 3 months of deactivation of a member.
                            However, you can force delete the member with this action.
                        </ListItem>
                        <ListItem>
                            This is an expensive operation as it involves deleting multiple documents from the database.
                            It involves both read and delete operation.
                        </ListItem>
                    </List>
                </MyAlert>

                <GroupButtons>
                    <Button variant='default' onClick={() => closeAllModals()}>
                        Close
                    </Button>
                    <Button
                        type='submit'
                        variant='filled'
                        color='red'
                        disabled={!form.isValid()}
                        leftSection={<IconDelete size={20} />}
                    >
                        Delete
                    </Button>
                </GroupButtons>
            </Stack>
        </form>
    );
}
