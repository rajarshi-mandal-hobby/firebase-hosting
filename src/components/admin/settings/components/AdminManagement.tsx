// Admin Management component - Refactored to use real-time Firebase listeners and React best practices
import React, { useState, useMemo, useCallback } from 'react';
import {
  Stack,
  Group,
  Card,
  Text,
  Button,
  TextInput,
  Switch,
  Modal,
  Badge,
  ActionIcon,
  Alert,
  Loader,
} from '@mantine/core';
import { IconTrash, IconUserPlus, IconInfoCircle } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useAdminConfig } from '../hooks/useAdminConfig';

interface ConfirmationAction {
  type: 'add' | 'remove';
  uid: string;
  onConfirm: () => Promise<void>;
}

const AdminManagement: React.FC = () => {
  // Use the new real-time hook instead of imperative fetching
  const { adminConfig, loading, error, addAdmin, removeAdmin } = useAdminConfig();

  // Component state
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationOpened, { open: openConfirmation, close: closeConfirmation }] = useDisclosure(false);
  const [pendingAction, setPendingAction] = useState<ConfirmationAction | null>(null);

  // Form for new admin UID
  const adminForm = useForm<{
    newAdminUID: string;
  }>({
    initialValues: {
      newAdminUID: '',
    },
    validate: {
      newAdminUID: (value) => (value && value.length < 10 ? 'Invalid Firebase UID format' : null),
    },
  });

  // Derived state - admin UIDs list
  const adminUIDs = useMemo(() => adminConfig?.list || [], [adminConfig?.list]);

  // Handle adding admin with confirmation
  const handleAddAdmin = useCallback(async () => {
    const uid = adminForm.values.newAdminUID.trim();
    if (uid && !adminUIDs.includes(uid)) {
      setPendingAction({
        type: 'add',
        uid,
        onConfirm: async () => {
          try {
            setSubmitting(true);
            await addAdmin(uid);
            adminForm.setFieldValue('newAdminUID', '');
            notifications.show({
              title: 'Success',
              message: 'Admin added successfully',
              color: 'green',
            });
          } catch (error) {
            console.error('Failed to add admin:', error);
            notifications.show({
              title: 'Error',
              message: 'Failed to add admin',
              color: 'red',
            });
          } finally {
            setSubmitting(false);
          }
        },
      });
      openConfirmation();
    }
  }, [adminForm, adminUIDs, addAdmin, openConfirmation]);

  // Handle removing admin with confirmation
  const handleRemoveAdmin = useCallback(
    (uid: string) => {
      if (adminUIDs.length <= 1) {
        notifications.show({
          title: 'Cannot Remove',
          message: 'At least one admin must remain in the system',
          color: 'yellow',
        });
        return;
      }

      setPendingAction({
        type: 'remove',
        uid,
        onConfirm: async () => {
          try {
            setSubmitting(true);
            await removeAdmin(uid);
            notifications.show({
              title: 'Success',
              message: 'Admin removed successfully',
              color: 'green',
            });
          } catch (error) {
            console.error('Failed to remove admin:', error);
            notifications.show({
              title: 'Error',
              message: 'Failed to remove admin',
              color: 'red',
            });
          } finally {
            setSubmitting(false);
          }
        },
      });
      openConfirmation();
    },
    [adminUIDs.length, removeAdmin, openConfirmation]
  );

  // Handle confirmation modal confirm
  const handleConfirm = useCallback(async () => {
    if (pendingAction) {
      await pendingAction.onConfirm();
      setPendingAction(null);
      closeConfirmation();
    }
  }, [pendingAction, closeConfirmation]);

  // Handle confirmation modal cancel
  const handleCancel = useCallback(() => {
    setPendingAction(null);
    closeConfirmation();
  }, [closeConfirmation]);

  if (loading) {
    return (
      <Card withBorder p='md'>
        <Group justify='center'>
          <Loader size='sm' />
          <Text>Loading admin configuration...</Text>
        </Group>
      </Card>
    );
  }

  if (error) {
    return (
      <Card withBorder p='md'>
        <Alert color='red' title='Error' icon={<IconInfoCircle size={16} />}>
          {error}
        </Alert>
      </Card>
    );
  }

  return (
    <>
      <Card withBorder shadow='sm' p='md'>
        <Stack gap='md'>
          <Group justify='space-between' align='center'>
            <Text size='lg' fw={500}>
              Admin Management
            </Text>
            <Switch
              label='Edit Mode'
              checked={editMode}
              onChange={(event) => setEditMode(event.currentTarget.checked)}
            />
          </Group>

          <Alert color='blue' icon={<IconInfoCircle size={16} />}>
            Manage system administrators using Firebase UIDs. At least one admin must remain in the system.
          </Alert>

          {/* Current Admins */}
          <div>
            <Text size='sm' fw={500} mb='xs'>
              Current Administrators ({adminUIDs.length})
            </Text>
            <Stack gap='xs'>
              {adminUIDs.map((uid) => (
                <Group
                  key={uid}
                  justify='space-between'
                  p='xs'
                  style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)' }}>
                  <Group gap='xs'>
                    <Badge variant='light' color='blue'>
                      Admin
                    </Badge>
                    <Text size='sm' style={{ fontFamily: 'monospace' }}>
                      {uid}
                    </Text>
                  </Group>
                  {editMode && (
                    <ActionIcon
                      color='red'
                      variant='subtle'
                      onClick={() => handleRemoveAdmin(uid)}
                      disabled={submitting || adminUIDs.length <= 1}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                </Group>
              ))}
            </Stack>
          </div>

          {/* Add New Admin */}
          {editMode && (
            <Group gap='xs'>
              <TextInput
                placeholder='Enter Firebase UID'
                value={adminForm.values.newAdminUID}
                onChange={(event) => adminForm.setFieldValue('newAdminUID', event.currentTarget.value)}
                error={adminForm.errors['newAdminUID']}
                style={{ flex: 1 }}
              />
              <Button
                leftSection={<IconUserPlus size={16} />}
                onClick={handleAddAdmin}
                disabled={!adminForm.values.newAdminUID.trim() || submitting}
                loading={submitting}>
                Add Admin
              </Button>
            </Group>
          )}
        </Stack>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        opened={confirmationOpened}
        onClose={handleCancel}
        title={`${pendingAction?.type === 'add' ? 'Add' : 'Remove'} Administrator`}
        centered>
        <Stack gap='lg'>
          <Text>
            Are you sure you want to {pendingAction?.type === 'add' ? 'add' : 'remove'} the following UID{' '}
            {pendingAction?.type === 'add' ? 'as an' : 'from'} administrator?
          </Text>

          <Text
            size='sm'
            style={{
              fontFamily: 'monospace',
              backgroundColor: 'var(--mantine-color-gray-0)',
              padding: 'var(--mantine-spacing-xs)',
              borderRadius: 'var(--mantine-radius-sm)',
            }}>
            {pendingAction?.uid}
          </Text>

          <Group justify='flex-end' gap='sm'>
            <Button variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            <Button color={pendingAction?.type === 'add' ? 'blue' : 'red'} onClick={handleConfirm} loading={submitting}>
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default AdminManagement;
