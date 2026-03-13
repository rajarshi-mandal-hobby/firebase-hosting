import { Stack, Title, Paper, Button, Text } from '@mantine/core';
import { GroupButtons } from '.';

export const MaxRetryError = new Error('Maximum retry attempts reached. Refresh the page to try again.', {
    cause: 'max-retries'
});

interface ErrorContainerProps {
    error: Error | string;
    onRetry?: () => void;
    isErrorBoundary?: boolean;
}

export const ErrorContainer = ({ error, onRetry, isErrorBoundary = false }: ErrorContainerProps) => {
    const errorName = typeof error === 'string' ? 'Error' : error.name;
    const errorMessage = typeof error === 'string' ? error : error.message;
    const isMaxRetryError = typeof error === 'string' ? error.includes('Maximum retry') : error.cause === 'max-retries';
    return (
        <Stack gap='sm' style={{ wordBreak: 'break-word' }} my='xl'>
            <Title order={2} ta='center' c='dimmed'>
                {isErrorBoundary ? '╰（‵□′）╯' : '（╯°□°）╯︵ ┻━┻'}
            </Title>
            <Title order={4} ta='center' c='dimmed'>
                There is must be some mistake.
            </Title>
            <Paper p='lg' withBorder>
                <Text fw={500} mb='xs'>
                    Info: {errorName}
                </Text>
                <Text c='dimmed' mt='xs' component='pre' style={{ whiteSpace: 'pre-wrap' }}>
                    {errorMessage}
                </Text>

                <GroupButtons justify='space-between'>
                    <Button variant='default' onClick={() => window.location.reload()}>
                        Refresh
                    </Button>
                    {onRetry && (
                        <Button onClick={onRetry} disabled={isMaxRetryError}>
                            Retry
                        </Button>
                    )}
                </GroupButtons>
            </Paper>
        </Stack>
    );
};
