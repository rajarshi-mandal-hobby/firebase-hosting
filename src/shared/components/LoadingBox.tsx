import { Box, Stack, type BoxComponentProps, type TextProps } from '@mantine/core';
import { LoaderSleeping } from './LoaderSleeping';

interface LoadingBoxProps {
    boxProps?: BoxComponentProps;
    textProps?: TextProps;
    message?: string;
}

export const LoadingBox = ({ boxProps, textProps, message }: LoadingBoxProps) => {
    return (
        <Box my='xl' {...boxProps}>
            <Stack align='center' justify='center' gap={0}>
                <LoaderSleeping {...textProps} message={message} />
            </Stack>
        </Box>
    );
};
