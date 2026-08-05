import { Center, Stack, Title, Button } from '@mantine/core';
import { Navigate } from 'react-router';
import { useAuth } from '../../contexts';
import { PATHNAME } from '../../data/types';
import { IconGoogle } from '../../shared/icons';
import { LoadingBox } from '../../shared/components';

export default function SignIn() {
    const { user, pending, isAuthState, handleSignIn } = useAuth();

    if (!isAuthState) {
        return (
            <Center h='100vh'>
                <LoadingBox message='Authenticating…' />
            </Center>
        );
    }

    if (user) return <Navigate to={PATHNAME.home} replace />;

    return (
        <Center h='100vh'>
            <Stack>
                <Title ta='center' order={2}>
                    Rajarshi's Mess
                </Title>

                <Button
                    leftSection={<IconGoogle size={18} />}
                    onClick={handleSignIn}
                    variant='outline'
                    loading={pending}
                    disabled={pending}
                >
                    Continue with Google
                </Button>
            </Stack>
        </Center>
    );
}
