import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AuthProvider } from './contexts';
import { PATHNAME } from './data/types';
import SignIn from './pages/sign-In/SignIn';
import { NotReachable, AppContainer } from './shared/components';
import { theme } from './theme';

const AdminDashboard = lazy(() => import('./pages/admin-dashboard/AdminDashboard'));
const DefaultRentsPage = lazy(() => import('./pages/default-rents/DefaultRentsPage'));
const GenerateBillsPage = lazy(() => import('./pages/generate-bills/GenerateBillsPage'));
const MemberDetailsPage = lazy(() => import('./pages/member-details/MemberDetails'));
const MemberFormPage = lazy(() => import('./pages/member-form/MemberFormPage'));

const router = createBrowserRouter([
    {
        path: PATHNAME.signin,
        Component: SignIn
    },
    {
        path: PATHNAME.home,
        Component: AdminDashboard,
        children: [
            { path: PATHNAME.default_rents, Component: DefaultRentsPage },
            { path: PATHNAME.generate_bills, Component: GenerateBillsPage },
            { path: PATHNAME.member_action, Component: MemberFormPage },
            { path: PATHNAME.member_details, Component: MemberDetailsPage }
        ]
    },
    {
        path: '*',
        Component: NotReachable
    }
]);

export default function App() {
    return (
        <MantineProvider theme={theme}>
            <Notifications w='max-content' position='bottom-center' />
            <ModalsProvider>
                <AppContainer>
                    <AuthProvider>
                        <RouterProvider router={router} useTransitions={false} />
                    </AuthProvider>
                </AppContainer>
            </ModalsProvider>
        </MantineProvider>
    );
}
