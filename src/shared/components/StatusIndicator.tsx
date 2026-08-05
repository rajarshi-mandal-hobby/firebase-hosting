import { Box, ThemeIcon, type MantineColor } from '@mantine/core';
import type { MemberStatus, PaymentStatus } from '../../data/types';
import { StatusThemeIcon } from './payment-status-helpers';
import type { config } from 'valibot';
import { GoogleIcon, type GoogleIconName } from '../icons/factory';

type Positions = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

type MemberStatusKey = Exclude<MemberStatus, 'all'> | 'deactivate';

interface StatusIndicatorProps {
    status: MemberStatusKey;
    children: React.ReactNode;
    borderWidth?: number;
    size?: number;
    position?: Positions;
    boxShadow?: boolean;
}

interface IconConfig {
    color: MantineColor;
    iconName: GoogleIconName;
}

const MemberStatusConfig: Record<MemberStatusKey, IconConfig> = {
    active: {
        iconName: 'person_check',
        color: 'green'
    },
    inactive: {
        iconName: 'person_remove',
        color: 'red'
    },
    deactivate: {
        iconName: 'person_alert',
        color: 'orange'
    }
} as const;

interface MemberStatusThemeIconProps {
    memberStatus: MemberStatusKey;
    size?: number;
}

export const getMemberStatusColor = (status: MemberStatusKey): MantineColor => MemberStatusConfig[status].color;

export const getMemberStatusIcon = (status: MemberStatusKey): GoogleIconName =>
    MemberStatusConfig[status].iconName;

export const MemberStatusThemeIcon = ({ memberStatus, size = 16 }: MemberStatusThemeIconProps) => {
    const config = MemberStatusConfig[memberStatus];
    const innerIcSz = size - 4;
    return (
        <ThemeIcon color={config.color} size={size} radius='xl' autoContrast={false}>
            <GoogleIcon iconName={config.iconName} size={innerIcSz} />
        </ThemeIcon>
    );
};

export function StatusIndicator({
    status,
    size = 20,
    children,
    position = 'bottom-right',
    borderWidth = 2,
    boxShadow = false
}: StatusIndicatorProps) {
    // Map GeneralStatus to PaymentStatus for reuse
    const borderRadius = size / 2;
    const positionOffset = borderWidth - size / 2;
    const positionStyles = {
        'top-left': { top: positionOffset, left: positionOffset },
        'top-right': { top: positionOffset, right: positionOffset },
        'bottom-left': { bottom: positionOffset, left: positionOffset },
        'bottom-right': { bottom: positionOffset, right: positionOffset }
    }[position];

    const outerIcSz = size - 2 * borderWidth;

    return (
        <Box pos='relative'>
            {children}
            <Box
                pos='absolute'
                {...positionStyles}
                bdrs={borderRadius}
                w={size}
                h={size}
                display='flex'
                bd={`${borderWidth}px solid white`}
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: boxShadow ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
                }}
            >
                <MemberStatusThemeIcon memberStatus={status} size={outerIcSz} />
            </Box>
        </Box>
    );
}
