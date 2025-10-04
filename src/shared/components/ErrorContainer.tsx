import { Stack, Title, Paper, Button, Text } from '@mantine/core';

export const ErrorContainer = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  return (
    <Stack gap='sm' style={{ wordBreak: 'break-word' }}>
      <Title order={2} ta='center' fw={500}>
        {'Oops! :('}
      </Title>
      <Title order={4} ta='center' c='dimmed'>
        There is must be some mistake.
      </Title>
      <Paper p='lg' withBorder>
        <Text size='sm' fw={500} mb='xs'>
          Info: {error.name}
        </Text>
        <Text size='xs' c='dimmed' mt='xs' component='pre' style={{ whiteSpace: 'pre-wrap' }}>
          {error.stack ?? error.message ?? 'An unknown error occurred.'}
        </Text>
        <Button size='xs' mt='lg' onClick={resetErrorBoundary}>
          Reload
        </Button>
      </Paper>
    </Stack>
  );
};
