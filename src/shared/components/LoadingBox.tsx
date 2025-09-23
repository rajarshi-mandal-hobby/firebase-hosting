import { Group, Loader, Text } from '@mantine/core';

interface LoadingBoxProps {
  boxSize?: string & {};
  loaderSize?: string & {};
  loadingText?: string;
  minHeight?: number; // min height if full screen
}

export const LoadingBox = ({ loadingText, minHeight, boxSize, loaderSize }: LoadingBoxProps) => {
  console.log('Rendering LoadingBox');
  return (
    <Group mih={minHeight || 300} align='center' justify='center'>
      <Loader size={loaderSize || 'md'} />
      <Text size={boxSize || 'sm'} c='dimmed'>
        {loadingText || 'Loading...'}
      </Text>
    </Group>
  );
};
