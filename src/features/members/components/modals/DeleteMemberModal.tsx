import { TextInput, Alert } from "@mantine/core";
import { ALT_TEXT } from "../../../../data/types";
import { MemberActionModal } from "../../../../shared/components";
import { IconClose } from "../../../../shared/icons";
import { displayPhoneNumber } from "../../../../shared/utils";
import { useDeleteMemberModal } from "./hooks/useDeleteMemberModal";

interface DeleteMemberModalProps {
    opened: boolean;
    onClose: () => void;
}

export const DeleteMemberModal = ({ opened, onClose }: DeleteMemberModalProps) => {

    const {
        selectedMember,
        isModalWorking,
        workingMemberName,
        isSuccess,
        errorMemberName,
        hasErrors,
        hasError,
        handleErrorReset,
        handleDelete,
        confirmationText,
        deleteError,
        setConfirmationTextHandler
    } = useDeleteMemberModal(opened, onClose);

    console.log("Rendering Delete Member Modal");

    return (
        <MemberActionModal
            opened={opened}
            onClose={onClose}
            modalTitle='Delete Member'
            isModalWorking={isModalWorking}
            workingMemberName={workingMemberName}
            selectedMemberName={selectedMember?.name || null}
            memberDescription={displayPhoneNumber(selectedMember?.phone || "0000000000")}
            isSuccess={isSuccess}
            alertOnErrorProps={{
                errorMemberName: errorMemberName ?? ALT_TEXT,
                modalType: "deleteMember",
                hasGlobalErrors: hasErrors,
                hasErrorForMember: hasError,
                resetCallback: () => handleErrorReset()
            }}
            actionButtonProps={{
                handleConfirmAction: handleDelete,
                disabled: isModalWorking || !!deleteError,
                buttonText: "Delete",
                buttonProps: {
                    color: "red"
                }
            }}>
            <TextInput
                label='Permanently delete this member?'
                description={
                    !deleteError && confirmationText !== "DELETE" ? "Type DELETE to confirm permanent deletion"
                        : confirmationText === "DELETE" ?
                            "Are you sure?"
                            : null
                }
                value={confirmationText}
                onChange={(event) => setConfirmationTextHandler(event.currentTarget.value)}
                error={deleteError}
                inputWrapperOrder={["label", "input", "description", "error"]}
                rightSection={confirmationText && <IconClose onClick={() => setConfirmationTextHandler("")} />}
                required
            />

            {/* Warning Alert */}
            <Alert color='red' title='Warning'>
                This action will permanently delete this member and all associated data. This action cannot be undone.
            </Alert>
        </MemberActionModal>
    );
};
