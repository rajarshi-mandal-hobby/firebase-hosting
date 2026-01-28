import { type ButtonProps, Modal, Stack, Collapse, Alert, Group, Button, Text } from "@mantine/core";
import { type ModalType, modalTypeMessages } from "../../features/admin/stores/modal-store";
import { IconExclamation } from "../icons";
import { ICON_SIZE, ALT_TEXT } from "../types";
import { GroupButtons, MyLoadingOverlay } from ".";

interface MemberActionModalProps {
    opened: boolean;
    onClose: () => void;
    modalTitle: string;
    isModalWorking: boolean;
    selectedMemberName: string | null;
    memberDescription?: string | null;
    workingMemberName: string | null;
    isSuccess: boolean;
    children: React.ReactNode;
    alertOnErrorProps: {
        errorMemberName: string;
        modalType: ModalType;
        hasGlobalErrors: boolean;
        hasErrorForMember: boolean;
        resetCallback: () => void;
    };
    actionButtonProps: {
        handleConfirmAction: () => void;
        disabled: boolean;
        buttonText: string;
        buttonProps?: ButtonProps;
    };
}

export const MemberActionModal = ({
    opened,
    onClose,
    isModalWorking,
    isSuccess: success,
    workingMemberName,
    selectedMemberName,
    memberDescription,
    children,
    modalTitle: title,
    alertOnErrorProps: { errorMemberName: memberName, modalType, hasGlobalErrors, hasErrorForMember, resetCallback },
    actionButtonProps: { handleConfirmAction, disabled, buttonText, buttonProps }
}: MemberActionModalProps) => {
    const failedToMessage = modalTypeMessages[modalType](memberName).error;
    return (
        <Modal opened={opened} onClose={onClose} title={title} centered size='sm' pos='relative'>
            <MyLoadingOverlay
                visible={isModalWorking || success}
                name={workingMemberName || ""}
                success={success}
            />
            <Stack gap='lg'>
                <Collapse in={hasGlobalErrors}>
                    <Alert color='red' p='xs' variant='outline' icon={<IconExclamation size={ICON_SIZE} />}>
                        {hasErrorForMember ?
                            <Group wrap='nowrap' grow preventGrowOverflow={false}>
                                <Text>{failedToMessage}. You can try again or reset the form to clear the error.</Text>
                                <Button size='xs' onClick={resetCallback} w={130} autoFocus={false}>
                                    Reset
                                </Button>
                            </Group>
                            : <Text>Failed transaction for {memberName || ALT_TEXT}</Text>}
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
                <GroupButtons>
                    <Button variant='transparent' onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmAction} disabled={disabled} loading={isModalWorking} {...buttonProps}>
                        {buttonText}
                    </Button>
                </GroupButtons>
            </Stack>
        </Modal>
    );
};
