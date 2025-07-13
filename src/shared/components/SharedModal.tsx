import { Modal, Group, Button, LoadingOverlay } from '@mantine/core';
import type { ModalProps, ButtonProps } from '@mantine/core';
// import { IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';

interface SharedModalProps extends Omit<ModalProps, 'children'> {
  /** Modal content */
  children: ReactNode;
  /** Whether the modal is currently loading (shows overlay) */
  loading?: boolean;
  /** Primary action button text */
  primaryActionText?: string;
  /** Secondary action button text (usually "Cancel") */
  secondaryActionText?: string;
  /** Primary action button props */
  primaryActionProps?: ButtonProps;
  /** Secondary action button props */
  secondaryActionProps?: ButtonProps;
  /** Primary action handler */
  onPrimaryAction?: () => void;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Whether to show action buttons in footer */
  showActions?: boolean;
}

/**
 * Shared Modal Component
 *
 * Provides consistent modal layout across the application with:
 * - Prominent header with close icon
 * - Loading overlay support
 * - Consistent action button layout
 * - Blurred backdrop for focus
 * - Theme-based styling through defaultProps
 */
export function SharedModal({
  children,
  loading = false,
  primaryActionText = 'Save',
  secondaryActionText = 'Cancel',
  primaryActionProps = {},
  secondaryActionProps = {},
  onPrimaryAction,
  onSecondaryAction,
  showActions = true,
  ...modalProps
}: SharedModalProps) {
  return (
    <Modal
      {...modalProps}
      closeButtonProps={{
        // children: <IconX size={16} />,
        'aria-label': 'Close modal',
        ...modalProps.closeButtonProps,
      }}
      centered>
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />

      {children}

      {showActions && (
        <Group justify='flex-end' mt='md' pt='md'>
          <Button
            variant='default'
            onClick={onSecondaryAction || modalProps.onClose}
            disabled={loading}
            {...secondaryActionProps}>
            {secondaryActionText}
          </Button>

          {onPrimaryAction && (
            <Button onClick={onPrimaryAction} loading={loading} {...primaryActionProps}>
              {primaryActionText}
            </Button>
          )}
        </Group>
      )}
    </Modal>
  );
}
