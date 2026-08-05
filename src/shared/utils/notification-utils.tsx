import { Loader, type MantineColor } from '@mantine/core';
import { notifications, type NotificationData } from '@mantine/notifications';
import { GoogleIcon, type GoogleIconName } from '../icons/factory';

type NotificationType = 'success' | 'error' | 'info' | 'loading';

// Configuration for notification types
const NOTIFICATION_CONFIG: Record<NotificationType, { color: MantineColor; iconName: GoogleIconName | 'loader' }> = {
    success: {
        color: 'green',
        iconName: 'check'
    },
    error: {
        color: 'red',
        iconName: 'priority_high'
    },
    info: {
        color: 'indigo',
        iconName: 'info'
    },
    loading: {
        color: 'yellow',
        iconName: 'loader'
    }
} as const;

type NotifyType = keyof typeof NOTIFICATION_CONFIG;

const DEFAULT_AUTO_CLOSE = 2000;
const DEFAULT_ICON_SIZE = 16;

/**
 * Displays a notification. If an `id` is provided, it updates the existing notification.
 */
export const notify = ({ autoClose = DEFAULT_AUTO_CLOSE, ...props }: NotificationData): string =>
    notifications.show({
        autoClose,
        withCloseButton: false,
        ...props
    });

/**
 * Updates an existing notification.
 */
export const notifyUpdate = ({
    id,
    autoClose = DEFAULT_AUTO_CLOSE,
    ...props
}: Omit<NotificationData, 'id'> & { id: string }) =>
    notifications.update({
        id,
        autoClose,
        withCloseButton: false,
        bg: 'gray.0',
        ...props
    });

export const notifyClose = (id: string) => notifications.hide(id);

export const notifyCloseAll = () => notifications.clean();

const notifyFactory = (type: NotifyType) => {
    const { color: configColor, iconName } = NOTIFICATION_CONFIG[type];
    return (
        message: string,
        config?: {
            id?: string;
            update?: boolean;
            showIcon?: boolean;
            title?: string;
        }
    ) => {
        const id = config?.id;
        const update = config?.update;
        const isLoading = type === 'loading';
        const title = config?.title;

        const autoClose: number | false =
            type === 'loading' ? false
            : type === 'error' ? 3000
            : DEFAULT_AUTO_CLOSE;

        const notificationData: NotificationData = {
            id,
            message,
            title,
            color: configColor,
            icon:
                (config?.showIcon ?? iconName === 'loader') ?
                    <Loader size={DEFAULT_ICON_SIZE} />
                :   <GoogleIcon iconName={iconName} size={DEFAULT_ICON_SIZE} />,
            loading: isLoading,
            withCloseButton: type === 'error',
            autoClose
        };
        return !!id && !!update ? notifyUpdate({ id, ...notificationData }) : notify(notificationData);
    };
};

export const notifySuccess = notifyFactory('success');

export const notifyError = notifyFactory('error');

export const notifyInfo = notifyFactory('info');

export const notifyLoading = notifyFactory('loading');
