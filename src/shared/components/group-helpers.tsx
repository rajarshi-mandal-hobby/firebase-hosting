import { Group, type GroupProps } from '@mantine/core';

export const GroupSpaceApart = ({ children, ...props }: GroupProps) => (
    <Group justify="space-between" {...props}>
        {children}
    </Group>
);

export const GroupIcon = ({ children, ...props }: GroupProps) => {
    return (
        <Group gap="xs" wrap="nowrap" {...props}>
            {children}
        </Group>
    );
};

export const GroupButtons = ({ children, ...props }: GroupProps) => {
    return (
        <Group justify="flex-end" mt="xl" {...props}>
            {children}
        </Group>
    );
};
