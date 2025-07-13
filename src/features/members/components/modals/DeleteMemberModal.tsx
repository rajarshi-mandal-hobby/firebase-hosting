import { useState } from 'react';
import { 
  Stack, 
  Text, 
  Group, 
  Avatar, 
  Badge, 
  Button,
  Alert
} from '@mantine/core';
import { SharedModal } from '../../../../shared/components/SharedModal';
import { notifications } from '@mantine/notifications';

interface Member {
  id?: string;
  name: string;
  phone: string;
  floor: string;
  bedType: string;
  isActive: boolean;
}

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
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!member) return;

    try {
      setDeleting(true);
      
      // Mock API call for permanent deletion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notifications.show({
        title: 'Success',
        message: `${member.name} has been permanently deleted`,
        color: 'green'
      });

      console.log('Member permanently deleted:', {
        memberId: member.id,
        memberName: member.name
      });

      onClose();
    } catch (error) {
      console.error('Error deleting member:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete member. Please try again.',
        color: 'red'
      });
    } finally {
      setDeleting(false);
    }
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

        {/* Action Buttons */}
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} loading={deleting}>
            Delete Permanently
          </Button>
        </Group>
      </Stack>
    </SharedModal>
  );
}
