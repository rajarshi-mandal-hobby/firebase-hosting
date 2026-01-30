import { Box } from "@mantine/core";
import type { GeneralStatus, PaymentStatus } from "../types/firestore-types";
import { StatusBadge } from "../utils";

type Positions = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface StatusIndicatorProps {
    status: GeneralStatus;
    children: React.ReactNode;
    borderWidth?: number;
    size?: number;
    position?: Positions;
    boxShadow?: boolean;
}

// Simple mapping for GeneralStatus-only statuses
const generalStatusMap = {
    active: "Paid",
    inactive: "Due"
} as const;

export function StatusIndicator({
    status,
    size = 18,
    children,
    position = "bottom-right",
    borderWidth = 2,
    boxShadow = false
}: StatusIndicatorProps) {
    // Map GeneralStatus to PaymentStatus for reuse
    const paymentStatus: GeneralStatus =
        generalStatusMap[status as keyof typeof generalStatusMap] || (status as PaymentStatus);
    const borderRadius = size / 2;
    const positionOffset = borderWidth - size / 2;
    let positionStyles = {};

    switch (position) {
        case "top-left":
            positionStyles = { top: positionOffset, left: positionOffset };
            break;
        case "top-right":
            positionStyles = { top: positionOffset, right: positionOffset };
            break;
        case "bottom-left":
            positionStyles = { bottom: positionOffset, left: positionOffset };
            break;
        case "bottom-right":
        default:
            positionStyles = { bottom: positionOffset, right: positionOffset };
            break;
    }

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
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: boxShadow ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "none"
                }}>
                <StatusBadge status={paymentStatus} size={size - 2 * borderWidth} />
            </Box>
        </Box>
    );
}
