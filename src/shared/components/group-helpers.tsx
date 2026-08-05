import { Group, Stack, Text, type DefaultMantineColor, type GroupProps, type MantineSpacing } from '@mantine/core';
import type { ReactNode } from 'react';
import { toIndianLocale } from '../utils';
import { GoogleIcon, type GoogleIconName } from '../icons/factory';

export const GroupSpaceApart = ({ children, ...props }: GroupProps) => (
    <Group justify='space-between' {...props}>
        {children}
    </Group>
);

export const GroupIcon = ({ children, ...props }: GroupProps) => (
    <Group gap='xs' wrap='nowrap' {...props}>
        {children}
    </Group>
);

export const GroupButtons = ({ children, ...props }: GroupProps) => (
    <Group justify='flex-end' mt='md' {...props}>
        {children}
    </Group>
);

interface GroupTableProps {
    iconName?: GoogleIconName;
    icon?: ReactNode;
    label: string;
    value: string | number;
    labelFw?: number;
    valueFw?: number;
    iconSize?: number;
    labelColor?: DefaultMantineColor;
    valueColor?: DefaultMantineColor;
}

export const GroupTable = ({
    iconName,
    icon,
    label,
    value,
    labelFw = 500,
    valueFw = 400,
    iconSize,
    valueColor,
    labelColor
}: GroupTableProps) => (
    <GroupSpaceApart>
        <GroupIcon>
            {!!icon && icon}
            {!!iconName && <GoogleIcon iconName={iconName} fw={labelFw} c={labelColor} size={iconSize} />}
            <Text fw={labelFw} c={labelColor}>
                {label}
            </Text>
        </GroupIcon>
        <Text fw={valueFw} c={valueColor}>
            {typeof value === 'number' ? toIndianLocale(value) : value}
        </Text>
    </GroupSpaceApart>
);

// 2. Wrapped the array in an object for proper React props typing
interface FinancialSummaryGridProps {
    items: GroupTableProps[];
    gap?: MantineSpacing;
}

export const SummaryGrid = ({ items, gap = 'xs' }: FinancialSummaryGridProps) => (
    <Stack gap={gap}>
        {items.map((item) => (
            <GroupTable key={item.label} {...item} />
        ))}
    </Stack>
);
