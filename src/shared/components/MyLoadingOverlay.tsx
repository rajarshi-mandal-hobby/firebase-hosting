import { LoadingOverlay } from '@mantine/core';
import { LoaderSleeping } from './LoaderSleeping';

export const MyLoadingOverlay = LoadingOverlay.withProps({
  overlayProps: {
    blur: 2
  },
  loaderProps: {
    children: <LoaderSleeping c="var(--mantine-color-text)" fz="xs" />
  },
  zIndex: 100,
});
