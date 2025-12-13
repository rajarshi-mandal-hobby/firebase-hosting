import type { MemberActionModalProps } from '..';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export const ActivationModal = ({ opened, member, onClose, onExitTransitionEnd }: MemberActionModalProps) => {
  const navigate = useNavigate();

  const handleReactivateClick = () => {
    onClose();
    if (member) {
      navigate('/edit-member/', { state: { member, action: 'reactivate' } });
    }
  };
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Reactivate Member"
      size="sm"
      onExitTransitionEnd={onExitTransitionEnd}>
      {member && (
        <Stack gap="sm">
          <Text fw={500} fz="lg">
            {member.name}
          </Text>
          <Text>
            Reactivating will take you to the member edit page for <strong>{member.name.split(' ')[0]}</strong>. The
            electricity bill will be calculated from the next month of reactivation.
          </Text>
          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="white" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleReactivateClick}>Reactivate</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};
