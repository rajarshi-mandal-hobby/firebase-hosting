import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AdminDashboard } from './pages/AdminDashboard';
import { MemberDashboard } from './pages/MemberDashboard';
import { SignIn } from './pages/SignIn';
import { DataProvider } from './contexts/DataProvider';

const router = createBrowserRouter([
    {
        path: '/',
        element: <AdminDashboard />,
    },
    {
        path: '/admin',
        element: <AdminDashboard />,
    },
    {
        path: '/member',
        element: <MemberDashboard />,
    },
    {
        path: '/signin',
        element: <SignIn />,
    },
]);

export default function App() {
    return (
        <MantineProvider theme={theme}>
            <DataProvider>
                <Notifications position="bottom-center" />
                <RouterProvider router={router} />
            </DataProvider>
        </MantineProvider>
    );
}
