// Reusable Error Notification Component
import React from "react";
import { showErrorNotification } from "../../utils/notifications";

// React component for consistent error handling in forms
interface ErrorNotificationProps {
  error: string | null;
  visible: boolean;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  visible,
}) => {
  React.useEffect(() => {
    if (visible && error) {
      showErrorNotification({
        message: error,
      });
    }
  }, [error, visible]);

  return null; // This component doesn't render anything
};

export default ErrorNotification;
