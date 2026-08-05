import {
    alpha,
    Box,
    Paper,
    Space,
    ThemeIcon,
    Title,
    useMantineTheme,
    type DefaultMantineColor,
    type PaperBaseProps,
    type PaperProps
} from '@mantine/core';
import type { ReactNode } from 'react';
import { GoogleIcon, type GoogleIconName } from '../icons/factory';

interface MyAlertProps extends PaperProps {
    variant?: 'default' | 'outline';
    color?: DefaultMantineColor;
    iconName?: GoogleIconName;
    title?: string;
    children?: ReactNode;
}

export const MyAlert = ({ variant = 'default', color, iconName, title, children, ...paperProps }: MyAlertProps) => {
    const theme = useMantineTheme();
    const mainColor = color?.split('.')[0] ?? 'yellow';
    const themeColor = theme.colors[mainColor][6];
    const borderColor = variant === 'outline' ? themeColor : undefined;

    const hasIcon = !!iconName;
    const hasTitle = !!title;
    const themeIcz = 24;
    const innerIcz = 18;
    const mt = themeIcz / 2;

    return (
        <Box pos='relative'>
            <Paper
                {...paperProps}
                p='sm'
                withBorder={variant === 'outline'}
                mt={mt}
                style={{
                    borderColor,
                    backgroundColor: variant === 'default' ? alpha(themeColor, 0.1) : undefined
                }}
            >
                {hasIcon && (
                    <ThemeIcon
                        size={themeIcz}
                        variant='gradient'
                        gradient={{
                            from: `${mainColor}.7`,
                            to: `${mainColor}.4`
                        }}
                        pos='absolute'
                        top={0}
                        left='50%'
                        style={{
                            transform: 'translateX(-50%)',
                            zIndex: 1
                        }}
                    >
                        {<GoogleIcon iconName={iconName} size={innerIcz} />}
                    </ThemeIcon>
                )}

                {hasTitle && (
                    <>
                        <Space h={mt / 2} />
                        <Title order={5} fw={300} lineClamp={1} ta='center' c={`${mainColor}.9`}>
                            {title}
                        </Title>
                    </>
                )}

                {(hasIcon || hasTitle) && !!children && <Space h={mt} />}

                {children}
            </Paper>
        </Box>
    );
};
