import { Center, type CenterProps, type TextProps } from '@mantine/core';
import { LoaderSleeping } from './LoaderSleeping';

type LoadingBoxProps = {
    mih?: number;
    centerProps?: CenterProps;
    textProps?: TextProps;
}

export const LoadingBox = ({ mih = 300, centerProps, textProps }: LoadingBoxProps) => {
  return (
    <Center mih={mih} {...centerProps}>
      <LoaderSleeping {...textProps} />
    </Center>
  );
};
