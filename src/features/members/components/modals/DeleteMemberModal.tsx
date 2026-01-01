import { useState, useTransition } from "react";
import { Stack, Text, Group, Button, Alert, TextInput, Modal } from "@mantine/core";
import { IconClose } from "../../../../shared/icons";
import { displayPhoneNumber } from "../../../../shared/utils";
import { notifyError, notifySuccess } from "../../../../shared/utils/notifications";
import type { MemberActionModalProps } from "../index";

export const DeleteMemberModal = ({ opened, onClose, member, onExitTransitionEnd }: MemberActionModalProps) => {
   const [isDeleting, startDeleting] = useTransition();
   const [confirmationText, setConfirmationText] = useState("");

   const handleDelete = async () => {
      if (!member || confirmationText !== "DELETE" || isDeleting) {
         return;
      }

      try {
         startDeleting(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setConfirmationText("");
            onClose();
            notifySuccess("Member deleted successfully");
         });
      } catch (error) {
         console.error("Error deleting member:", error);
         // Error notification is handled by the AppContext
         notifyError(error instanceof Error ? error.message : "Something went wrong");
      }
   };

   const handleDeleteClick = () => {
      void handleDelete();
   };

   if (!member) return null;

   return (
      <Modal
         opened={opened}
         onClose={onClose}
         title='Permanent Deletion'
         size='sm'
         onExitTransitionEnd={onExitTransitionEnd}>
         <Stack gap='lg'>
            {/* Member Info */}
            <Stack gap={2}>
               <Text fw={500} size='lg'>
                  {member.name}
               </Text>
               <Text>{displayPhoneNumber(member.phone)}</Text>
            </Stack>

            {/* DELETE Confirmation Input */}
            <Stack gap={5}>
               <Text>Are you sure you want to permanently delete this member?</Text>
               <TextInput
                  description={
                     !confirmationText
                        ? "Type DELETE to confirm permanent deletion"
                        : confirmationText === "DELETE"
                          ? "Are you sure?"
                          : null
                  }
                  value={confirmationText}
                  onChange={(event) => setConfirmationText(event.currentTarget.value)}
                  error={confirmationText && confirmationText !== "DELETE" ? 'Must type "DELETE" exactly' : null}
                  inputWrapperOrder={["label", "input", "description", "error"]}
                  rightSection={confirmationText && <IconClose />}
                  rightSectionProps={{
                     onClick: () => setConfirmationText("")
                  }}
                  required
               />
            </Stack>

            {/* Warning Alert */}
            <Alert color='red' title='Warning'>
               <Text>
                  This action will permanently delete the member and all associated data. This action cannot be undone.
               </Text>
            </Alert>

            {/* Action Buttons */}
            <Group justify='flex-end' gap='sm'>
               <Button
                  variant='white'
                  onClick={() => {
                     setConfirmationText("");
                     onClose();
                  }}>
                  Cancel
               </Button>
               <Button
                  color='red'
                  onClick={handleDeleteClick}
                  loading={isDeleting}
                  disabled={confirmationText !== "DELETE" || isDeleting}>
                  Delete Permanently
               </Button>
            </Group>
         </Stack>
      </Modal>
   );
};
