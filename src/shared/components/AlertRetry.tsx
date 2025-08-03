import { Stack, Text, Alert, Button } from '@mantine/core';
import { memo } from 'react';

interface AlertRetryProps {
  alertMessage: string | null;
  errorMessage: string | null;
  handleRetry: () => void;
  loading: boolean;
}

export const AlertRetry = memo<AlertRetryProps>((props) => {
  return (
    <Stack gap='lg'>
      <Alert color='red' title='Oops! Something went wrong.' variant='white' p={0}>
        <Text size='sm' mb='sm'>
          {props.alertMessage || 'An error occurred while processing your request.'}
        </Text>
        <Text size='xs' c='dimmed' bg='var(--mantine-color-body)'>
          {props.errorMessage || 'An unexpected error occurred.'}
        </Text>
        <Button size='sm' onClick={props.handleRetry} loading={props.loading || false} mt='md'>
          Retry
        </Button>
      </Alert>
    </Stack>
  );
});

AlertRetry.displayName = 'AlertRetry';
