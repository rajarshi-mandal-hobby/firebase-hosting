import { Stack, Title, Paper, Button, Text } from "@mantine/core";
import { GroupButtons } from ".";

interface ErrorContainerProps {
    error: Error;
    onRetry?: () => void;
}

export const ErrorContainer = ({ error, onRetry }: ErrorContainerProps) => {
    return (
        <Stack gap='sm' style={{ wordBreak: "break-word" }} my='xl'>
            <Title order={2} ta='center' c='dimmed'>
                {"╰（‵□′）╯"}
            </Title>
            <Title order={4} ta='center' c='dimmed'>
                There is must be some mistake.
            </Title>
            <Paper p='lg' withBorder>
                <Text fw={500} mb='xs'>
                    Info: {error.name ?? "Unknown"}
                </Text>
                <Text c='dimmed' mt='xs' component='pre' style={{ whiteSpace: "pre-wrap" }}>
                    {error.message ?? "Unknown"}
                </Text>

                <GroupButtons>
                    <Button variant='default' onClick={() => window.location.reload()}>
                        Reload
                    </Button>
                    {onRetry && <Button onClick={onRetry}>Retry</Button>}
                </GroupButtons>
            </Paper>
        </Stack>
    );
};
