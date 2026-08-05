import { Button, Center, Stack, Text } from '@mantine/core';
import { NothingToShow } from './NothingToShow';
import { Link, useNavigate } from 'react-router';
import { IconArrowBack } from '../icons';
import { PATHNAME } from '../../data/types';
import { useLocation } from 'react-router';

export const NotReachable = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        if (history.length > 2) {
            navigate(-1);
            return;
        }
        navigate(PATHNAME.home, { replace: true });
    };

    console.log('history', history.length);
    return (
        <Stack align='center' justify='center' h='100vh' gap='sm'>
            <NothingToShow message='404' size='xl' />
            <Text size='xl'>The page you are looking for does not exist!</Text>
            <Button leftSection={<IconArrowBack size={18} />} onClick={handleBack}>
                Go back
            </Button>
        </Stack>
    );
};
