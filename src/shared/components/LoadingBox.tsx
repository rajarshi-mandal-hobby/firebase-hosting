import { Box, Button, Flex, Group, Loader, Text } from '@mantine/core';
import { memo } from 'react';
import { CssLoader } from '../custom-loader/CssLoader';

interface LoadingBoxProps {
  size?: string & {};
  loadingText?: string;
  minHeight?: number; // min height if full screen
}

export const LoadingBox = memo<LoadingBoxProps>(({ loadingText, minHeight, size }) => {
  console.log('Rendering LoadingBox');
  return (

      <Group justify='center' mih={minHeight || '100%'} align='center' flex={1}>
        <Loader size={'sm'} />
        <Text size={size || 'sm'} c='dimmed'>
          {loadingText || 'Loading...'}
        </Text>
      </Group>
  );
});
