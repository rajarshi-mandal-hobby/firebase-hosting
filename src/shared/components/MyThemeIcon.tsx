import { ThemeIcon } from '@mantine/core';
import type { IconComponent } from '../icons';
import { GroupIcon } from './group-helpers';
import { DEFAULT_SVG_SIZE } from '../types';

interface GroupIconProps {
    Icon: IconComponent;
    children?: React.ReactNode;

    size?: number;
    color?: string;
}

export function MyThemeIcon({ children, Icon, size = 20, color = 'gray' }: GroupIconProps) {
    // Define icon size
    let iconSize = size - 6;
    if (size <= DEFAULT_SVG_SIZE) iconSize = size - 2;
    // Define colors
    let userColor = color.split('.')[0];
    if (!userColor) userColor = 'gray';
    const themeIconColor = userColor + (userColor === 'gray' ? '.2' : '.0');
    const iconColor = userColor + '.9';

    return (
        <GroupIcon>
            <ThemeIcon size={size} variant='filled' color={themeIconColor}>
                <Icon size={iconSize} color={iconColor} />
            </ThemeIcon>
            {children}
        </GroupIcon>
    );
}
