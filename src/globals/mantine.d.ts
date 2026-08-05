import {
    ButtonVariant,
    BadgeVariant,
    ActionIconVariant,
    type StyleProp,
    type MantineStyleProps,
    type MantineFontWeight
} from '@mantine/core';

// Define the unique name of your new variant
type MyLight = 'my-light';

declare module '@mantine/core' {
    // Extend Button prop options
    export interface ButtonProps {
        variant?: ButtonVariant | MyLight;
    }

    // Extend Badge prop options
    export interface BadgeProps {
        variant?: BadgeVariant | MyLight;
    }

    // Extend ActionIcon prop options
    export interface ActionIconProps {
        variant?: ActionIconVariant | MyLight;
    }
}
