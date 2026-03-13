import { Center, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { FormStoreProvider, MembersProvider } from './contexts';
import { AuthProvider } from './contexts/AuthContext';
import { AdminDashboard } from './pages/admin-dashboard/AdminDashboard';
import { NothingToShow, AppContainer } from './shared/components';
import { theme } from './theme';
import { DefaultRentsProvider } from './contexts/DefaultRentsProvider';

const router = createBrowserRouter([
    {
        path: '/',
        Component: AdminDashboard,
        children: [
            {
                path: 'default-rents',
                element: <></>
            },
            {
                path: 'generate-bills',
                element: <></>
            },
            {
                path: 'member-action',
                element: <></>
            },
            {
                path: 'member-details',
                element: <></>
            }
        ]
    },
    {
        path: '*',
        element: (
            <Center h='100vh'>
                <NothingToShow />
            </Center>
        )
    }
]);

export default function App() {
    return (
        <MantineProvider theme={theme}>
            <AuthProvider>
                <Notifications position='bottom-center' containerWidth='max-content' />
                <AppContainer>
                    <MembersProvider>
                        <DefaultRentsProvider>
                            <FormStoreProvider>
                                <RouterProvider router={router} unstable_useTransitions={false} />
                            </FormStoreProvider>
                        </DefaultRentsProvider>
                    </MembersProvider>
                </AppContainer>
            </AuthProvider>
        </MantineProvider>
    );
}
