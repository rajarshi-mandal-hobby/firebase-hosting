import { Alert, Box, Title, type AlertProps } from '@mantine/core';
import { GroupIcon } from '.';
import type { IconComponent } from '../icons';
import { DEFAULT_SVG_SIZE } from '../types';

interface MyAlertProps extends AlertProps {
    children: React.ReactNode;
    title?: string;
    Icon?: IconComponent;
}

export const MyAlert = ({ title, color = 'red', Icon, children = null, ...props }: MyAlertProps) => {
    const isTitle = !!title;
    const iconSize = title ? 20 : DEFAULT_SVG_SIZE;
    return (
        <Alert p='md' color={color} {...props}>
            <GroupIcon mb={title ? 'sm' : undefined}>
                {Icon && (
                    <Box size={iconSize}>
                        <Icon size={iconSize} color='var(--alert-color)' />
                    </Box>
                )}
                {isTitle ?
                    <Title order={5} c='var(--alert-color)'>
                        {title}
                    </Title>
                :   <Box c={props.c}>{children}</Box>}
            </GroupIcon>
            {isTitle && children}
        </Alert>
    );
};
