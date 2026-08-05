import {
    type ButtonProps,
    Modal,
    Stack,
    Collapse,
    Alert,
    Button,
    Text,
    type ModalProps,
    Title,
    Badge
} from '@mantine/core';
import type { ReactNode } from 'react';
import { useGlobalErrorData } from '../../contexts';
import { IconPriorityHigh } from '../icons';

import { GroupButtons, GroupIcon } from './group-helpers';
import { MyLoadingOverlay } from './MyLoadingOverlay';
import type { PaymentStatus } from '../../data/types';
import { getPaymentStatusConfig, getPaymentStatusIcon } from '../utils';

export interface GlobalModalProps {
    opened: boolean;
    onClose: () => void;
}

interface GlobalModalConfigProps extends GlobalModalProps, ModalProps {
    modalTitle: string;
    memberDescription?: string | ReactNode;
    status?: PaymentStatus;
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
    status,
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
    const paymentStatus = status ? getPaymentStatusConfig(status) : null;
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
            <MyLoadingOverlay visible={isPending} message={selectedMember?.name} />
            <Stack gap='lg'>
                <Collapse expanded={hasGlobalErrors}>
                    <Alert
                        color='red'
                        p='xs'
                        variant='outline'
                        icon={<IconPriorityHigh />}
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

                <Stack gap='xs'>
                    <GroupIcon>
                        <Title fw={300} order={2} lineClamp={1}>
                            {selectedMember?.name ?? ALT_TEXT}
                        </Title>
                        {!!paymentStatus && (
                            <Badge
                                variant='gradient'
                                gradient={{ from: `${paymentStatus.color}.7`, to: `${paymentStatus.color}.5`, deg: 90 }}
                                leftSection={<paymentStatus.Icon size={12} />}
                                size='sm'
                                style={{
                                    lineClamp: 1
                                }}
                            >
                                {paymentStatus.paymentStatus}
                            </Badge>
                        )}
                    </GroupIcon>
                    {memberDescription
                        && (typeof memberDescription === 'string' ?
                            <Text>{memberDescription}</Text>
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
