import { Group, Loader, Text } from '@mantine/core';
import { memo } from 'react';

interface LoadingBoxProps {
  loadingText: string;
  fullScreen?: boolean;
}

export const LoadingBox = memo<LoadingBoxProps>(({ loadingText, fullScreen = false }: LoadingBoxProps) => {
  return (
    <Group justify='center' h={fullScreen ? '100vh' : ''}>
      <Loader size='sm' />
      <Text size='sm' c='dimmed'>
        {loadingText}
      </Text>
    </Group>
  );
});
