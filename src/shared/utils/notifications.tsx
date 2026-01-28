import { notifications, type NotificationData } from "@mantine/notifications";
import { CloseIcon, Loader, type NotificationProps } from "@mantine/core";
import { IconCheck, IconClose, IconDoneAll, IconInfo } from "../icons";

// Configuration for notification types
const NOTIFICATION_CONFIG = {
	success: {
		color: "green",
		icon: <IconCheck size={16} color='white' />
	},
	error: {
		color: "red",
		icon: <IconClose size={16} color='white' />
	},
	info: {
		color: "indigo",
		icon: <IconInfo size={16} color='white' />
	},
	loading: {
		color: "yellow",
		icon: <Loader size={16} color='white' />
	},
	doneAll: {
		color: "green.8",
		icon: <IconDoneAll size={16} color='white' />
	}
} as const;

export type NotifyType = keyof typeof NOTIFICATION_CONFIG;

type NotifyOptions = {
	message: string;
	autoClose?: number | false;
	type?: NotifyType;
	iconColor?: string;
} & Omit<NotificationProps, "color">;

const DEFAULT_AUTO_CLOSE = 2000;

/**
 * Displays a notification. If an `id` is provided, it updates the existing notification.
 */
export const notify = ({
	id,
	message,
	title,
	icon,
	iconColor,
	autoClose = DEFAULT_AUTO_CLOSE,
	type = "success",
	...props
}: NotifyOptions): string => {
	const config = NOTIFICATION_CONFIG[type];
	const color = iconColor || config.color;
	const iconNode = icon || config.icon;

	const notificationProps: NotificationData = {
		color,
		title,
		message,
		icon: iconNode,
		autoClose,
		withCloseButton: type !== "loading",
		...props
	};

	if (id) {
		notifications.update({
			id,
			...notificationProps
		});
		return id;
	}

	return notifications.show(notificationProps);
};

/**
 * Updates an existing notification.
 */
export const notifyUpdate = (id: string, message: string, options: Partial<NotifyOptions> = {}): string => {
	return notify({
		id,
		message,
		type: "doneAll",
		autoClose: DEFAULT_AUTO_CLOSE,
		...options
	});
};

export const notifySuccess = (message: string, options?: Partial<NotifyOptions>) =>
	notify({ message, type: "success", ...options });

export const notifyError = (message: string, options?: Partial<NotifyOptions>) =>
	notify({ message, type: "error", autoClose: 3000, ...options });

export const notifyInfo = (message: string, options?: Partial<NotifyOptions>) =>
	notify({ message, type: "info", ...options });

export const notifyLoading = (message: string, options?: Partial<NotifyOptions>) =>
	notify({
		message,
		type: "loading",
		autoClose: false,
		...options
	});
