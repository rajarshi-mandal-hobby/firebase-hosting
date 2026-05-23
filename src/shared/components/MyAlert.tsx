import { Alert, Box, ThemeIcon, Title, type AlertProps } from '@mantine/core';
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
            <GroupIcon mb={title ? 'xs' : undefined}>
                {!!Icon && isTitle && <Icon size={iconSize} color='var(--alert-color)' />}
                {!isTitle && !!Icon && (
                    <ThemeIcon size={iconSize} variant={isTitle ? 'light' : 'filled'} color='var(--alert-color)'>
                        <Icon size={iconSize - 4} />
                    </ThemeIcon>
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
