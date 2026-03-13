import { TextInput, Button, VisuallyHidden, Text, Stack } from '@mantine/core';
import { startTransition } from 'react';
import { GlobalModal } from '../../../../../../../shared/components/GlobalModal';
import { IconWarning } from '../../../../../../../shared/icons';
import { displayPhoneNumber, useGlobalFormResult } from '../../../../../../../shared/utils';
import { useGlobalFormStore } from '../../../../../../../contexts';
import type { GlobalModalProps } from '../../../../../../../shared/components/GlobalModal';
import { useForm } from '@mantine/form';
import { FormClearButton, GroupButtons, MyAlert } from '../../../../../../../shared/components';

interface DeleteMemberFormValues {
    confirmationText: string;
    memberId: string;
}

export const useDeleteMemberModal = ({ opened, onClose }: GlobalModalProps) => {
    const {
        state: { isPending, saveResult, error, values },
        dispatcher,
        onResetState,
        selectedMember
    } = useGlobalFormStore<DeleteMemberFormValues>('delete-member');

    const hasError = !!error || !saveResult?.success;

    const form = useForm<DeleteMemberFormValues>({
        initialValues: { confirmationText: '', memberId: '' },
        validate: {
            confirmationText: (val) => (val.trim() && val !== 'DELETE' ? 'Must type DELETE exactly' : null),
            memberId: (val) => (!val || val !== selectedMember?.id ? 'Member ID is required' : null)
        }
    });

    const otherErrors = useGlobalFormResult<DeleteMemberFormValues>({
        form,
        selectedMember,
        opened,
        onClose,
        onResetState,
        initial: {
            confirmationText: '',
            memberId: selectedMember?.id || ''
        },
        values,
        error,
        saveResult,
        isPending
    });

    const handleErrorReset = () => {
        form.reset();
        onResetState();
    };

    return {
        form,
        selectedMember,
        isPending,
        hasError,
        handleErrorReset,
        otherErrors,
        handleDelete: (values: DeleteMemberFormValues) => {
            startTransition(async () => await dispatcher(values));
        }
    };
};

export function DeleteMemberModal({ opened, onClose }: GlobalModalProps) {
    const { form, selectedMember, isPending, hasError, handleErrorReset, handleDelete, otherErrors } =
        useDeleteMemberModal({
            opened,
            onClose
        });

    console.log('Rendering Delete Member Modal');

    return (
        <GlobalModal
            opened={opened}
            onClose={onClose}
            modalTitle='Delete Member'
            isPending={isPending}
            hasErrorForMemeber={hasError}
            onResetError={handleErrorReset}
            memberDescription={displayPhoneNumber(selectedMember?.phone || '0000000000')}
            otherErrors={otherErrors}
        >
            <form onSubmit={form.onSubmit(handleDelete)}>
                <Stack gap='lg'>
                    <TextInput
                        autoComplete='off'
                        label='Permanently delete this member?'
                        description={
                            !form.errors.confirmationText && form.values.confirmationText !== 'DELETE' ?
                                'Type DELETE to confirm permanent deletion'
                            : form.values.confirmationText === 'DELETE' ?
                                'Are you sure?'
                            :   null
                        }
                        inputWrapperOrder={['label', 'input', 'description', 'error']}
                        rightSection={<FormClearButton field='confirmationText' form={form} />}
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
                    <MyAlert color='red' title='Warning' Icon={IconWarning}>
                        This action will permanently delete this member and all associated data and cannot be undone.
                    </MyAlert>

                    <GroupButtons>
                        <Button variant='transparent' onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type='submit' variant='filled' color='red' disabled={isPending || !form.isDirty()}>
                            Delete
                        </Button>
                    </GroupButtons>
                </Stack>
            </form>
        </GlobalModal>
    );
}
