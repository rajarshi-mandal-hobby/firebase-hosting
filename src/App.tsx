import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { Center, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { NothingToShow, AppContainer } from './shared/components';
import { theme } from './theme';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import { FormStoreProvider } from './features/admin/default-rents/components/DefaultRentsPage';
import { MembersProvider } from './data/services/membersService';

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
                    {/* <RootProvider> */}
                    <MembersProvider>
                        <FormStoreProvider>
                            <RouterProvider router={router} />
                        </FormStoreProvider>
                    </MembersProvider>
                    {/* </RootProvider> */}
                </AppContainer>
            </AuthProvider>
        </MantineProvider>
    );
}
