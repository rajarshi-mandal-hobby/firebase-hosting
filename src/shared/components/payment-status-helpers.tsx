import { ThemeIcon, type BadgeProps, Badge } from '@mantine/core';
import { DEFAULT_SVG_SIZE, type PaymentStatus } from '../../data/types';
import { getPaymentStatusConfig } from '../utils';
import { GoogleIcon } from '../icons/factory';

// StatusBadge component
interface StatusIconProps {
    paymentStatus: PaymentStatus;
    size?: number;
}

export const StatusThemeIcon = ({ paymentStatus, size = DEFAULT_SVG_SIZE }: StatusIconProps) => {
    const config = getPaymentStatusConfig(paymentStatus);
    const iconSize = size > 24 ? size * 0.7 : size - 2;
    return (
        <ThemeIcon color={config.color} size={size} radius='xl' autoContrast={false}>
            <GoogleIcon iconName={config.iconName} size={iconSize} />
        </ThemeIcon>
    );
};

type StatusBadgeSize = BadgeProps['size'];

interface StatusBadgeProps {
    status: PaymentStatus;
    showStatusTitle?: boolean;
    size?: StatusBadgeSize;
}

export const StatusBadge = ({ status, showStatusTitle = false, size = 'md' }: StatusBadgeProps) => {
    const config = getPaymentStatusConfig(status);
    const gradientConfig = { from: `${config.color}.7`, to: `${config.color}.5`, deg: 45 };
    let iconsz = DEFAULT_SVG_SIZE;
    if (size === 'xs') iconsz -= 6;
    if (size === 'sm') iconsz -= 4;
    if (size === 'md') iconsz -= 2;
    if (size === 'xl') iconsz += 2;

    return (
        <Badge
            variant='gradient'
            gradient={gradientConfig}
            leftSection={<GoogleIcon iconName={config.iconName} size={iconsz} />}
            size={size}
        >
            {showStatusTitle ? config.title : status}
        </Badge>
    );
};
