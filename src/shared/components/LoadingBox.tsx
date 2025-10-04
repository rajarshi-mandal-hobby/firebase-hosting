import { Group, Loader, Text } from '@mantine/core';

interface LoadingBoxProps {
  boxSize?: string & {};
  loaderSize?: string & {};
  loadingText?: string;
  minHeight?: number; // min height if full screen
  forComponent?: string; // for logging which component is loading
}

export const LoadingBox = ({ loadingText, minHeight, boxSize, loaderSize, forComponent }: LoadingBoxProps) => {
  console.log('Rendering LoadingBox', { forComponent });
  return (
    <Group mih={minHeight || 300} align='center' justify='center'>
      <Loader size={loaderSize || 'md'} />
      <Text size={boxSize || 'sm'} c='dimmed'>
        {loadingText || 'Loading...'}
      </Text>
    </Group>
  );
};
