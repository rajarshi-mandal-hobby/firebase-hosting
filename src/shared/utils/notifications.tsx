import { Loader } from '@mantine/core';
import { notifications, type NotificationData } from '@mantine/notifications';
import { IconCheck, IconPriorityHigh, IconInfo, IconDoneAll } from '../icons';

// Configuration for notification types
const NOTIFICATION_CONFIG = {
    success: {
        color: 'green',
        icon: <IconCheck size={16} color='white' />
    },
    error: {
        color: 'red',
        icon: <IconPriorityHigh size={16} color='white' />
    },
    info: {
        color: 'indigo',
        icon: <IconInfo size={16} color='white' />
    },
    loading: {
        color: 'yellow',
        icon: <Loader size={16} color='white' />
    },
    doneAll: {
        color: 'green.8',
        icon: <IconDoneAll size={16} color='white' />
    }
} as const;

export type NotifyType = keyof typeof NOTIFICATION_CONFIG;

const DEFAULT_AUTO_CLOSE = 2000;

export const notifyCloseAll = () => notifications.clean();

/**
 * Displays a notification. If an `id` is provided, it updates the existing notification.
 */
export const notify = ({ autoClose = DEFAULT_AUTO_CLOSE, ...props }: NotificationData): string =>
    notifications.show({
        autoClose,
        withCloseButton: false,
        bg: 'gray.0',
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

const notifyFactory = (type: NotifyType) => {
    const { color: configColor, icon: configIcon } = NOTIFICATION_CONFIG[type];
    return (
        message: string,
        config?: {
            id?: string;
            update?: boolean;
            showIcon?: boolean;
        }
    ) => {
        const id = config?.id;
        const update = config?.update;
        const isLoading = type === 'loading';

        const notificationData: NotificationData = {
            id,
            message,
            color: configColor,
            icon: config?.showIcon ?? configIcon,
            loading: isLoading,
            withCloseButton: type === 'error',
            autoClose: type !== 'error' && type !== 'loading'
        };
        return !!id && !!update ? notifyUpdate({ id, ...notificationData }) : notify(notificationData);
    };
};

export const notifySuccess = notifyFactory('success');

export const notifyError = notifyFactory('error');

export const notifyInfo = notifyFactory('info');

export const notifyLoading = notifyFactory('loading');

export const notifyDoneAll = notifyFactory('doneAll');
