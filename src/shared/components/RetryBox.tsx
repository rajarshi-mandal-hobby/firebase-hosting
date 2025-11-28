import { Text, Alert, Button, Flex } from '@mantine/core';
import { memo } from 'react';

interface AlertRetryProps {
  alertTitle?: string;
  error?: unknown;
  loading?: boolean;
  handleRetry: () => void;
}

export const RetryBox = memo<AlertRetryProps>(({ alertTitle, error, loading, handleRetry }) => {
  const errorMessage = error ? (error instanceof Error ? error.message : String(error)) : 'An unknown error occurred.';
  return (
    <Alert color='red.8' title={alertTitle || 'Oops! Something went wrong.'} variant='light'>
      <Text size='xs'>{errorMessage}</Text>
      <Flex justify='flex-end' gap='md'>
        <Button size='sm' onClick={handleRetry} loading={loading || false} mt='md' ta='right'>
          Retry
        </Button>
      </Flex>
    </Alert>
  );
});

RetryBox.displayName = 'RetryBox';
