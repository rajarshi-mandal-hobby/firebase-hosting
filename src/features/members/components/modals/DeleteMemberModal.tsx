import { useState } from 'react';
import { 
  Stack, 
  Text, 
  Group, 
  Avatar, 
  Badge, 
  Button,
  Alert,
  TextInput
} from '@mantine/core';
import { SharedModal } from '../../../../shared/components/SharedModal';
import { notifications } from '@mantine/notifications';
import { useAppContext } from '../../../../contexts/AppContext';
import type { Member } from '../../../../shared/types/firestore-types';

interface DeleteMemberModalProps {
  opened: boolean;
  onClose: () => void;
  member?: Member | null;
}

export function DeleteMemberModal({ 
  opened, 
  onClose, 
  member 
}: DeleteMemberModalProps) {
  const { deleteMember } = useAppContext();
  const [deleting, setDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleDelete = async () => {
    if (!member) return;

    // Validate "DELETE" confirmation
    if (confirmationText !== 'DELETE') {
      notifications.show({
        title: 'Confirmation Required',
        message: 'Please type "DELETE" to confirm permanent deletion',
        color: 'red'
      });
      return;
    }

    try {
      setDeleting(true);
      
      // Call the real deleteMember function from AppContext
      await deleteMember(member.id);
      
      console.log('Member permanently deleted:', {
        memberId: member.id,
        memberName: member.name
      });

      // Reset confirmation text and close modal
      setConfirmationText('');
      onClose();
    } catch (error) {
      console.error('Error deleting member:', error);
      // Error notification is handled by the AppContext
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    void handleDelete();
  };

  if (!member) return null;

  return (
    <SharedModal
      opened={opened}
      onClose={onClose}
      title="Delete Member Permanently"
      size="md"
    >
      <Stack gap="md">
        {/* Warning Alert */}
        <Alert color="red" title="Warning: Permanent Deletion">
          <Text size="sm">
            This action will permanently delete the member and all associated data. 
            This action cannot be undone. If you want to temporarily remove the member 
            with settlement calculation, use "Deactivate" instead.
          </Text>
        </Alert>

        {/* Member Info */}
        <Group>
          <Avatar size="lg" radius="xl" color="red">
            {(member.name?.[0] || 'M').toUpperCase()}
          </Avatar>
          <Stack gap={2}>
            <Text fw={500} size="lg">
              {member.name}
            </Text>
            <Text size="sm" c="dimmed">
              {member.phone}
            </Text>
            <Badge size="sm" color="gray">
              {member.floor} Floor - {member.bedType}
            </Badge>
          </Stack>
        </Group>

        <Text size="sm" c="dimmed" ta="center">
          Are you sure you want to permanently delete <strong>{member.name}</strong>? 
          This action cannot be undone.
        </Text>

        {/* DELETE Confirmation Input */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Type "DELETE" to confirm permanent deletion:
          </Text>
          <TextInput
            placeholder="Type DELETE here"
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.currentTarget.value)}
            error={confirmationText && confirmationText !== 'DELETE' ? 'Must type "DELETE" exactly' : null}
            required
          />
        </Stack>

        {/* Action Buttons */}
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={() => {
            setConfirmationText('');
            onClose();
          }}>
            Cancel
          </Button>
          <Button 
            color="red" 
            onClick={handleDeleteClick} 
            loading={deleting}
            disabled={confirmationText !== 'DELETE'}
          >
            Delete Permanently
          </Button>
        </Group>
      </Stack>
    </SharedModal>
  );
}
