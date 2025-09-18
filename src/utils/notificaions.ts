import { notifications } from '@mantine/notifications';

const autoClose = 3000; // 3 seconds

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
