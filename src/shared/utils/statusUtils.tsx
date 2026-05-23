import { ThemeIcon } from "@mantine/core";
import { IconCheck, IconDoneAll, IconPriorityHigh, type IconComponent } from "../icons";
import { DEFAULT_SVG_SIZE } from "../types";
import type { PaymentStatus } from "../../data/types";

// Define the shape of each status configuration

interface StatusConfigEntry {
  icon: IconComponent;
  color: string;
  title: string;
  status: PaymentStatus;
}

const StatusConfig: Record<PaymentStatus, StatusConfigEntry> = {
  Paid: {
    icon: IconCheck,
    color: "green",
    title: "Payment Complete",
    status: "Paid",
  },
  Overpaid: {
    icon: IconDoneAll,
    color: "green.7",
    status: "Overpaid",
    title: "Overpaid",
  },
  Partial: {
    icon: IconPriorityHigh,
    color: "orange",
    status: "Partial",
    title: "Partial Payment",
  },
  Due: {
    icon: IconPriorityHigh,
    color: "red",
    status: "Due",
    title: "Payment Due",
  },
} as const;

export const getStatusAlertConfig = (status: PaymentStatus) => StatusConfig[status];
export const getStatusColor = (status: PaymentStatus) => StatusConfig[status].color;
export const getStatusIcon = (status: PaymentStatus) => StatusConfig[status].icon;
export const getStatusTitle = (status: PaymentStatus) => StatusConfig[status].title;
export const getStatus = (status: PaymentStatus) => StatusConfig[status].status;

// StatusBadge component
type StatusBadgeProps = {
  size?: number;
  status: PaymentStatus;
};

export const StatusBadge = ({ size = DEFAULT_SVG_SIZE, status }: StatusBadgeProps) => {
  const { icon: Icon, color } = StatusConfig[status];
  const innerIconSize = size - (size < 16 ? 2 : 4);

  return (
    <ThemeIcon color={color} size={size} radius='xl' autoContrast={false}>
      <Icon width={innerIconSize} height={innerIconSize} />
    </ThemeIcon>
  );
};
