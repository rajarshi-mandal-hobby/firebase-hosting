import { Group, Loader, Stack, Text, type TextProps } from '@mantine/core';
import classes from '../../shared/custom-loader/CssLoader.module.css';

interface LoadingBoxProps {
  boxSize?: string & {};
  loaderSize?: string & {};
  loadingText?: string;
  minHeight?: number; // min height if full screen
  forComponent?: string; // for logging which component is loading
}

type LoaderSleepingProps = TextProps & {
    componentName?: string;
};

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

export const LoaderSleeping = ({ componentName, ...props }: LoaderSleepingProps) => {
  console.log('Rendering SleepingLoader');
  return (
    <Stack align='center' justify='center' gap='md'>
      <Text className={classes['loader-sleeping']} c={'gray.6'} size='lg' {...props}>
        <span className={classes.face}>(￣o￣). z Z</span>
      </Text>
      <Text c='gray.7' fw={700} size='xs' {...props}>
        Getting things ready{componentName ? ` for ${componentName}` : ''}...
      </Text>
    </Stack>
  );
};
