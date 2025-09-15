import { notifications } from '@mantine/notifications';
import { fa } from 'zod/locales';

const autoClose = 5000; // 5 seconds

export const notify = {
  success: (message: string) => {
    notifications.show({
      title: 'Success',
      message,
      color: 'green.6',
      autoClose,
    });
  },
  error: (message: string) => {
    notifications.show({
      title: 'Error',
      message,
      color: 'red.6',
      autoClose,
    });
  },
};
