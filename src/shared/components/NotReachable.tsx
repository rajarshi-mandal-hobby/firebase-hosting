import { Center } from '@mantine/core';
import { NothingToShow } from './NothingToShow';

export const NotReachable = () => {
    return (
        <Center>
            <NothingToShow message='404' size='xl' />
        </Center>
    );
};
