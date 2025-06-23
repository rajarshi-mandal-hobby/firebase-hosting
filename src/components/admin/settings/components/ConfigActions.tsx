import React, { useCallback, memo } from "react";
import { Group, Button, Modal, Stack, Text } from "@mantine/core";
import type { ConfirmationModalState } from "../hooks/useConfigForm";

interface ConfigActionsProps {
  editMode: boolean;
  hasChanges: boolean;
  areAllFieldsFilled: boolean;
  submitting: boolean;
  confirmationModal: ConfirmationModalState;
  setConfirmationModal: (
    modal:
      | ConfirmationModalState
      | ((prev: ConfirmationModalState) => ConfirmationModalState),
  ) => void;
  handleReset: () => void;
  handleUpdate: () => Promise<void>;
}

interface ActionButtonsProps {
  editMode: boolean;
  hasChanges: boolean;
  areAllFieldsFilled: boolean;
  submitting: boolean;
  onReset: () => void;
  onUpdate: () => Promise<void>;
}

// Remove the separate ConfirmationModal component interface as we'll integrate it
// interface ConfirmationModalProps {
//   confirmationModal: ConfirmationModalState;
//   onClose: () => void;
//   onConfirm: () => void;
// }

// Separate component for action buttons - memoized to prevent unnecessary re-renders
const ActionButtons: React.FC<ActionButtonsProps> = memo(
  ({
    editMode,
    hasChanges,
    areAllFieldsFilled,
    submitting,
    onReset,
    onUpdate,
  }) => (
    <Group justify="flex-end" gap="md" mt="md">
      <Button
        variant="outline"
        onClick={onReset}
        radius="xl"
        disabled={!editMode || !hasChanges}
      >
        Reset
      </Button>
      <Button
        radius="xl"
        onClick={onUpdate}
        disabled={!editMode || !areAllFieldsFilled}
        loading={submitting}
      >
        Update
      </Button>
    </Group>
  ),
);
ActionButtons.displayName = "ActionButtons";

// Separate component for modal content - memoized to prevent unnecessary re-renders
const ModalContent: React.FC<{ confirmationModal: ConfirmationModalState }> =
  memo(({ confirmationModal }) => {
    const isUpdateConfirmation =
      confirmationModal.title === "Confirm Configuration Update";

    if (isUpdateConfirmation) {
      return (
        <Stack gap="xs">
          <Text fw={500}>Please review the following values:</Text>
          <Text
            component="div"
            style={{
              whiteSpace: "pre-line",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              backgroundColor: "var(--mantine-color-gray-0)",
              padding: "var(--mantine-spacing-xs)",
              borderRadius: "var(--mantine-radius-sm)",
              border: "1px solid var(--mantine-color-gray-3)",
            }}
          >
            {confirmationModal.message.split("\n\n")[1]}
          </Text>
        </Stack>
      );
    }

    return <Text>{confirmationModal.message}</Text>;
  });
ModalContent.displayName = "ModalContent";

export const ConfigActions: React.FC<ConfigActionsProps> = ({
  editMode,
  hasChanges,
  areAllFieldsFilled,
  submitting,
  confirmationModal,
  setConfirmationModal,
  handleReset,
  handleUpdate,
}) => {
  // Handle modal close - single source of truth
  const handleModalClose = useCallback(() => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  }, [setConfirmationModal]);

  // Handle modal confirm - single source of truth
  const handleModalConfirm = useCallback(() => {
    confirmationModal.onConfirm();
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  }, [confirmationModal, setConfirmationModal]);

  return (
    <>
      <ActionButtons
        editMode={editMode}
        hasChanges={hasChanges}
        areAllFieldsFilled={areAllFieldsFilled}
        submitting={submitting}
        onReset={handleReset}
        onUpdate={handleUpdate}
      />

      <Modal
        opened={confirmationModal.isOpen}
        onClose={handleModalClose}
        title={confirmationModal.title}
        centered
        size="md"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        styles={{
          title: {
            fontWeight: 600,
            fontSize: "1.125rem",
          },
          header: {
            borderBottom: "1px solid var(--mantine-color-gray-3)",
          },
          body: {
            padding: "var(--mantine-spacing-lg)",
          },
        }}
      >
        <Stack gap="lg">
          <ModalContent confirmationModal={confirmationModal} />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={handleModalClose}
              radius="xl"
              color="gray"
            >
              Cancel
            </Button>
            <Button onClick={handleModalConfirm} radius="xl" color="blue">
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
