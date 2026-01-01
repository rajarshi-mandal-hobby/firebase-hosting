import { Group, type GroupProps } from '@mantine/core';

type GroupApartProps = {
  children: React.ReactNode;
} & GroupProps;

export const GroupSpaceApart = ({ children, ...props }: GroupApartProps) => (
  <Group justify="space-between" {...props}>
    {children}
  </Group>
);

type GroupIconProps = {
  children: React.ReactNode;
} & GroupProps;

export const GroupIcon = ({ children, ...props }: GroupIconProps) => {
  return (
    <Group gap="xs" wrap="nowrap" {...props}>
      {children}
    </Group>
  );
};
