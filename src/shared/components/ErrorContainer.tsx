import { Stack, Title, Paper, Button, Text } from '@mantine/core';
import { GroupSpaceApart } from '.';

interface ErrorContainerProps {
    error: Error;
    onRetry?: () => void;
}

export const ErrorContainer = ({ error, onRetry }: ErrorContainerProps) => {
    const errorName = error.name ?? 'Unknown';
    const errorMessage = error.message ?? 'An unknown error occurred.';
    const isMaxRetryError = error.message.includes('Maximum retry');
    return (
        <Stack gap='sm' style={{ wordBreak: 'break-word' }} my='xl'>
            <Title order={2} ta='center' c='dimmed'>
                {'╰（‵□′）╯'}
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

                <GroupSpaceApart mt='xl'>
                    <Button variant='default' onClick={() => window.location.reload()}>
                        Refresh
                    </Button>
                    {onRetry && (
                        <Button onClick={onRetry} disabled={isMaxRetryError}>
                            Retry
                        </Button>
                    )}
                </GroupSpaceApart>
            </Paper>
        </Stack>
    );
};
