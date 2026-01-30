import { type ButtonProps, Modal, Stack, Collapse, Alert, Group, Button, Text } from '@mantine/core';
import { globalModalMessages, type ModalType } from './modal-store';
import { ALT_TEXT, ICON_SIZE } from '../../../data/types';
import { MyLoadingOverlay, GroupButtons } from '../../../shared/components';
import { IconExclamation } from '../../../shared/icons';

interface GlobalModalProps {
    opened: boolean;
    onClose: () => void;
    modalTitle: string;
    modalType: ModalType;
    selectedMemberName: string | null;
    memberDescription?: string | null;
    isModalWorking: boolean;
    isSuccess: boolean;
    workingMemberName: string | null;
    errorMemberName: string | null;
    hasGlobalErrors: boolean;
    hasErrorForModal: boolean;
    buttonDisabled: boolean;
    showButtons?: boolean;
    buttonText: string;
    buttonProps?: ButtonProps;
    children: React.ReactNode;
    resetCallback: () => void;
    handleConfirmAction?: () => void;
}

export const GlobalModal = ({
    opened,
    onClose,
    modalTitle,
    modalType,
    selectedMemberName,
    memberDescription,
    isModalWorking,
    isSuccess,
    workingMemberName,
    errorMemberName,
    hasGlobalErrors,
    hasErrorForModal,
    buttonDisabled,
    showButtons = true,
    buttonText,
    buttonProps,
    children,
    resetCallback,
    handleConfirmAction
}: GlobalModalProps) => {
    const errorMessage = errorMemberName ? globalModalMessages[modalType](errorMemberName).error : ALT_TEXT;
    const isVisible = isModalWorking || isSuccess;
    const currentWorkingMemberName = (isModalWorking ? workingMemberName : selectedMemberName) || ALT_TEXT;
    const isActivateModal = modalType === 'activateMember';
    return (
        <Modal opened={opened} onClose={onClose} title={modalTitle} centered size='sm' pos='relative'>
            <MyLoadingOverlay visible={isVisible} name={currentWorkingMemberName} success={isSuccess} />
            <Stack gap='lg'>
                <Collapse in={hasGlobalErrors}>
                    <Alert color='red' p='xs' variant='outline' icon={<IconExclamation size={ICON_SIZE} />}>
                        {hasErrorForModal ?
                            <Group wrap='nowrap' grow preventGrowOverflow={false}>
                                <Text>
                                    {errorMessage}. You can try again or reset the {isActivateModal && 'perticular'}{' '}
                                    form to clear the error.
                                </Text>
                                {!isActivateModal && (
                                    <Button size='xs' onClick={resetCallback} w={130} autoFocus={false}>
                                        Reset
                                    </Button>
                                )}
                            </Group>
                        :   <Text>Failed transaction for {errorMemberName}</Text>}
                    </Alert>
                </Collapse>

                <Stack gap={0}>
                    <Text fw={500} size='xl'>
                        {selectedMemberName ?? ALT_TEXT}
                    </Text>
                    {memberDescription && <Text>{memberDescription ?? ALT_TEXT}</Text>}
                </Stack>

                {children}

                {/* Action Buttons */}
                {showButtons && (
                    <GroupButtons>
                        <Button variant='transparent' onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmAction}
                            disabled={buttonDisabled}
                            loading={isModalWorking}
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
