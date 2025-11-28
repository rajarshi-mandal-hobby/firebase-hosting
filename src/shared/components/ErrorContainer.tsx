import { Stack, Title, Paper, Button, Text } from '@mantine/core';

export const ErrorContainer = ({ error, onRetry }: { error: Error; onRetry?: () => void }) => {
  return (
    <Stack gap='sm' style={{ wordBreak: 'break-word' }}>
      <Title order={2} ta='center' c='dimmed'>
        {'╰（‵□′）╯'}
      </Title>
      <Title order={4} ta='center' c='dimmed'>
        There is must be some mistake.
      </Title>
      <Paper p='lg' withBorder>
        <Text fw={500} mb='xs'>
          Info: {error.name}
        </Text>
        <Text size='sm' c='dimmed' mt='xs' component='pre' style={{ whiteSpace: 'pre-wrap' }}>
          {error.message ?? 'An unknown error occurred.'}
        </Text>
        {onRetry && (
          <Button size='xs' mt='lg' onClick={onRetry}>
            Reload
          </Button>
        )}
      </Paper>
    </Stack>
  );
};
