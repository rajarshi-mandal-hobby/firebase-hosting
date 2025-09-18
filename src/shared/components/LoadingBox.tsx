import { Box, Button, Flex, Group, Loader, Text } from '@mantine/core';
import { memo } from 'react';
import { CssLoader } from '../custom-loader/CssLoader';

interface LoadingBoxProps {
  boxSize?: string & {};
  loaderSize?: string & {};
  loadingText?: string;
  minHeight?: number; // min height if full screen
}

export const LoadingBox = memo<LoadingBoxProps>(({ loadingText, minHeight, boxSize, loaderSize }) => {
  console.log('Rendering LoadingBox');
  return (
    <Group mih={minHeight || 300} align='center' justify='center'>
      <Loader size={loaderSize || 'md'} />
      <Text size={boxSize || 'sm'} c='dimmed'>
        {loadingText || 'Loading...'}
      </Text>
    </Group>
  );
});
