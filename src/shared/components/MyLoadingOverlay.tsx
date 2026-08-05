import { LoadingOverlay, Paper, type LoadingOverlayProps } from '@mantine/core';
import { LoaderSleeping } from './LoaderSleeping';

interface MyLoadingOverlayProps extends LoadingOverlayProps {
    message?: string | null;
}

export const MyLoadingOverlay = ({ message, ...props }: MyLoadingOverlayProps) => (
    <LoadingOverlay
        loaderProps={{
            children: (
                <Paper p='md' shadow='xs' withBorder>
                    <LoaderSleeping message={message} />
                </Paper>
            )
        }}
        {...props}
    />
);
