import { type ButtonProps, Modal, Stack, Collapse, Alert, Button, Text, type ModalProps } from '@mantine/core';
import type { ReactNode } from 'react';
import { useGlobalErrorData } from '../../contexts';
import { IconExclamation } from '../icons';
import { ALT_TEXT } from '../types';
import { GroupButtons } from './group-helpers';
import { MyLoadingOverlay } from './MyLoadingOverlay';

export interface GlobalModalProps {
    opened: boolean;
    onClose: () => void;
}

interface GlobalModalConfigProps extends GlobalModalProps, ModalProps {
    modalTitle: string;
    memberDescription?: string | ReactNode;
    isPending: boolean;
    hasErrorForMemeber: boolean;
    otherErrors?: string | null;
    buttonDisabled?: boolean;
    showButtons?: boolean;
    buttonText?: string;
    buttonProps?: ButtonProps;
    onResetError?: () => void;
    onHandleConfirmAction?: () => void;
}

export const GlobalModal = ({
    opened,
    onClose,
    modalTitle,
    memberDescription,
    isPending,
    hasErrorForMemeber,
    otherErrors,
    buttonDisabled = false,
    showButtons = false,
    buttonText = 'Submit',
    buttonProps,
    children,
    onResetError,
    onHandleConfirmAction
}: GlobalModalConfigProps) => {
    const { errorCount, errorMembers, setSelectedMember, selectedMember } = useGlobalErrorData();
    const memberNames = Object.values(errorMembers).map((member) => member.name);
    const hasManyMembers = memberNames.length > 1;
    const hasGlobalErrors = errorCount > 0;
    const errorMemberName =
        hasManyMembers ? `${memberNames[0].split(' ')[0]} and ${errorCount - 1} more` : memberNames[0];
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            onExitTransitionEnd={() => setSelectedMember(null)}
            title={modalTitle}
            centered
            size='sm'
            pos='relative'
        >
            <MyLoadingOverlay visible={isPending} description={selectedMember?.name} />
            <Stack gap='lg'>
                <Collapse in={hasGlobalErrors}>
                    <Alert
                        color='red'
                        p='xs'
                        variant='outline'
                        icon={<IconExclamation />}
                        withCloseButton={hasErrorForMemeber && !!onResetError}
                        onClose={onResetError}
                        closeButtonLabel='Clear Error'
                    >
                        {hasErrorForMemeber ?
                            <Text>Try again or clear the error for {selectedMember?.name?.split(' ')[0]}</Text>
                        :   <Text>
                                {errorMemberName} has {hasManyMembers ? '' : 'a '} failed transaction
                                {hasManyMembers ? 's' : ''}.
                            </Text>
                        }
                        {!!otherErrors && <Text>{otherErrors}</Text>}
                    </Alert>
                </Collapse>

                <Stack gap={0}>
                    <Text fw={500} size='xl'>
                        {selectedMember?.name ?? ALT_TEXT}
                    </Text>
                    {memberDescription &&
                        (typeof memberDescription === 'string' ?
                            <Text>{memberDescription ?? ALT_TEXT}</Text>
                        :   memberDescription)}
                </Stack>

                {children}

                {/* Action Buttons */}
                {showButtons && (
                    <GroupButtons>
                        <Button variant='transparent' onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={onHandleConfirmAction}
                            disabled={buttonDisabled}
                            loading={isPending}
                            {...buttonProps}
                        >
                            {buttonText}
                        </Button>
                    </GroupButtons>
                )}
            </Stack>
        </Modal>
    );
};
