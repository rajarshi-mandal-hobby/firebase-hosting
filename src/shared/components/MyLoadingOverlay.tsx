import { LoadingOverlay, Paper, type LoadingOverlayProps } from '@mantine/core';
import { LoaderSleeping } from './LoaderSleeping';

const FactoryLoadingOverlay = LoadingOverlay.withProps({
    overlayProps: {
        blur: 2
    },
    zIndex: 100,
    transitionProps: {
        duration: 150,
        transition: 'fade',
        timingFunction: 'ease-in-out'
    }
});

interface NewLoadingOverlayProps extends LoadingOverlayProps {
    description?: string | null;
}

export const MyLoadingOverlay = ({ description, ...props }: NewLoadingOverlayProps) => (
    <FactoryLoadingOverlay
        loaderProps={{
            children: (
                <Paper p='sm' shadow='xs'>
                    <LoaderSleeping description={description ?? undefined} />
                </Paper>
            )
        }}
        {...props}
    />
);
