import type { Timestamp } from 'firebase/firestore';

/**
 * Date formatting utilities for consistent date display across the app
 */

/**
 * Format timestamp to locale string with error handling
 */
export const formatDate = (timestamp: Timestamp | null | undefined): string => {
  try {
    return (
      timestamp?.toDate?.()?.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) || 'N/A'
    );
  } catch {
    return 'N/A';
  }
};

/**
 * Format billing month ID (YYYY-MM) to readable month year
 */
export const formatMonthYear = (id: string): string => {
  try {
    const [year, month] = id.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
    });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format timestamp to full date and time
 */
export const formatDateTime = (timestamp: Timestamp | null | undefined): string => {
  try {
    return (
      timestamp?.toDate?.()?.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) || 'N/A'
    );
  } catch {
    return 'N/A';
  }
};

/**
 * Get current billing month in YYYY-MM format
 */
export const getCurrentBillingMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Check if a date is in the current month
 */
export const isCurrentMonth = (timestamp: Timestamp | null | undefined): boolean => {
  if (!timestamp) return false;

  try {
    const date = timestamp.toDate();
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  } catch {
    return false;
  }
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export const getRelativeTime = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return 'N/A';

  try {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  } catch {
    return 'N/A';
  }
};
