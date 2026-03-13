import { Stack, Group, ActionIcon, Title } from '@mantine/core';
import { AdminMenu } from './AdminMenu';
import { IconBack } from '../../../../shared/icons';
import { useMyNavigation } from '../../../../shared/hooks';

interface FormPageHeaderProps {
    title: string;
    children: React.ReactNode;
}

export const FormPageHeader = ({ title, children }: FormPageHeaderProps) => {
    const { goBack } = useMyNavigation();

    return (
        <Stack gap='lg' align='stretch' justify='center' p='md'>
            {/* Header */}
            <Group justify='space-between' align='center' h={38}>
                <Group>
                    <ActionIcon color='gray.1' variant='filled' size={32} onClick={goBack} autoContrast>
                        <IconBack />
                    </ActionIcon>
                    <Title order={3}>{title}</Title>
                </Group>
                {/* Menu Actions */}
                <AdminMenu />
            </Group>
            {/* Page Content */}
            {children}
        </Stack>
    );
};
