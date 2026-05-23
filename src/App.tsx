import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { ModalsProvider } from '@mantine/modals';
import { createBrowserRouter, RouterProvider, RouterContextProvider } from 'react-router';
import { AdminDashboard } from './pages/admin-dashboard/AdminDashboard';
import SignIn from './pages/sign-In/SignIn';
import { AppContainer } from './shared/components';
import { authLoader, authMiddleware, lazyImport } from './shared/utils';
import { theme } from './theme';
import { Notifications } from '@mantine/notifications';

const LoadingBox = lazyImport(() => import('./shared/components'), 'LoadingBox');
const DefaultRentsPage = lazyImport(
    () => import('./pages/admin-dashboard/components/default-rents/DefaultRentsPage'),
    'DefaultRentsPage',
);
const GenerateBillsPage = lazyImport(
    () => import('./pages/admin-dashboard/components/generate-bills/GenerateBillsPage'),
    'GenerateBillsPage',
);
const MemberFormPage = lazyImport(
    () => import('./pages/admin-dashboard/components/member-form/MemberFormPage'),
    'MemberFormPage',
);
const MemberDetailsPage = lazyImport(
    () => import('./pages/admin-dashboard/components/member-details/MemberDetails'),
    'MemberDetailsPage',
);
const NotReachable = lazyImport(() => import('./shared/components'), 'NotReachable');

const router = createBrowserRouter(
    [
        {
            path: '/signin',
            Component: SignIn,
            loader: authLoader,
            hydrateFallbackElement: <LoadingBox message='Authenticating...' />,
        },
        {
            path: '/',
            Component: AdminDashboard,
            middleware: [authMiddleware],
            hydrateFallbackElement: <LoadingBox />,
            children: [
                { path: 'default-rents', Component: DefaultRentsPage },
                { path: 'generate-bills', Component: GenerateBillsPage },
                { path: 'member-action', Component: MemberFormPage },
                { path: 'member-details', Component: MemberDetailsPage },
            ],
        },
        {
            path: '*',
            Component: NotReachable,
        },
    ],
    {
        getContext() {
            return new RouterContextProvider();
        },
    },
);

export default function App() {
    return (
        <MantineProvider theme={theme}>
            <Notifications w='max-content' position='bottom-center' />
            <ModalsProvider>
                <AppContainer>
                    <RouterProvider router={router} useTransitions={false} />
                </AppContainer>
            </ModalsProvider>
        </MantineProvider>
    );
}
