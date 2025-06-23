// Reusable notification utilities
import { notifications } from "@mantine/notifications";

export interface ErrorNotificationOptions {
  title?: string;
  message: string;
  autoClose?: number | false;
  color?: string;
}

export interface SuccessNotificationOptions {
  title?: string;
  message: string;
  autoClose?: number | false;
  color?: string;
}

/**
 * Show error notification with consistent styling
 */
export const showErrorNotification = (options: ErrorNotificationOptions) => {
  notifications.show({
    title: options.title || "Error",
    message: options.message,
    color: options.color || "red",
    autoClose: options.autoClose !== undefined ? options.autoClose : 5000,
  });
};

/**
 * Show success notification with consistent styling
 */
export const showSuccessNotification = (
  options: SuccessNotificationOptions,
) => {
  notifications.show({
    title: options.title || "Success",
    message: options.message,
    color: options.color || "green",
    autoClose: options.autoClose !== undefined ? options.autoClose : 4000,
  });
};

/**
 * Show info notification with consistent styling
 */
export const showInfoNotification = (options: SuccessNotificationOptions) => {
  notifications.show({
    title: options.title || "Information",
    message: options.message,
    color: options.color || "blue",
    autoClose: options.autoClose !== undefined ? options.autoClose : 4000,
  });
};

/**
 * Handle generic errors and show appropriate notifications
 */
export const handleError = (error: unknown, context?: string) => {
  console.error(`Error ${context ? `in ${context}` : ""}:`, error);

  let errorMessage = "An unexpected error occurred. Please try again.";

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object" && "message" in error) {
    errorMessage = String((error as { message: unknown }).message);
  }

  showErrorNotification({
    title: context ? `${context} Failed` : "Operation Failed",
    message: errorMessage,
  });
};

/**
 * Handle success operations and show appropriate notifications
 */
export const handleSuccess = (message: string, context?: string) => {
  showSuccessNotification({
    title: context ? `${context} Successful` : "Operation Successful",
    message,
  });
};
