import { Stack, Group, ActionIcon, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { AdminMenu } from './AdminMenu';
import { IconBack } from '../../../../shared/icons';

interface FormPageHeaderProps {
  title: string;
  children: React.ReactNode;
}

export const FormPageHeader = ({ title, children }: FormPageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <Stack gap='lg' align='stretch' justify='center' p='md'>
      {/* Header */}
      <Group justify='space-between' align='center' h={38}>
        <Group>
          <ActionIcon
            color='gray.1'
            variant='filled'
            size={32}
            onClick={() => navigate('/', { replace: true })}
            autoContrast>
            <IconBack size={16} />
          </ActionIcon>
          <Title order={4}>{title}</Title>
        </Group>
        {/* Menu Actions */}
        <AdminMenu />
      </Group>
      {/* Page Content */}
      {children}
    </Stack>
  );
};
