import { notifications } from '@mantine/notifications';
import { CloseIcon, Loader, rem, type NotificationProps } from '@mantine/core';
import React from 'react';
import { IconCheck, IconDoneAll, IconInfo } from '../shared/components';
import { no } from 'zod/locales';

const AutoCloseTime = 3000; // 3 seconds

const NotifyColor = {
  success: 'green.6',
  error: 'red.6',
  info: 'blue.6',
  loading: 'transparent',
  doneAll: 'teal.6',
} as const;

const NotifyIcons = {
  success: <IconCheck size={16} color='white' />,
  error: <CloseIcon size='16' color='white' />,
  info: <IconInfo size={16} color='white' />,
  loading: <Loader size={16} />,
  doneAll: <IconDoneAll size={16} color='white' />,
} as const;

type NotifyType = keyof typeof NotifyColor;

type NotifyOptions = {
  message: string;
  autoClose?: number | false;
  type?: NotifyType;
  iconColor?: string;
} & Omit<NotificationProps, 'color'>;

export const notify = ({
  id,
  message,
  title,
  icon,
  iconColor,
  autoClose = AutoCloseTime,
  type = 'success',
  ...props
}: NotifyOptions): string => {
  let color = iconColor || NotifyColor[type];
  const iconD = icon || NotifyIcons[type];
  let { height, width } = { height: rem(20), width: rem(20) };

  if (icon && React.isValidElement(icon) && icon.type === Loader) {
    color = 'transparent';
    height = '1em';
    width = '1em';
  }

  // If id is provided, update existing notification
  if (id) {
    notifications.update({
      id,
      color,
      title,
      message,
      icon: iconD,
      styles: {
        icon: { height, width },
      },
      style: {
        fontSize: rem(12),
      },
      ...props,
    });
    return id;
  }

  // Otherwise, show a new notification
  const notificationId = notifications.show({
    color,
    title,
    message,
    autoClose,
    icon: iconD,
    styles: {
      icon: { height, width },
    },
    style: {
      fontSize: rem(12),
    },
    ...props,
  });
  return notificationId;
};

export const notifyUpdate = (id: string, message: string, {iconColor, type}: {iconColor?: string, type?: NotifyType} = {}): string => {
  return notify({
    id,
    message,
    type: type || 'doneAll',
    iconColor,
  });
};

export const notifySuccess = (message: string) => {
  return notify({ message, type: 'success' });
};

export const notifyError = (message: string) => {
  return notify({ message, type: 'error' });
};

export const notifyInfo = (message: string) => {
  return notify({ message, type: 'info' });
};

export const notifyLoading = (message: string) => {
  return notify({
    message,
    type: 'loading',
  });
};
