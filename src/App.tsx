import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
// import { AdminDashboard } from './pages/AdminDashboard';
import { MemberDashboard } from './features/member-dashboard';
import { SignIn } from './pages/SignIn';
import { AuthProvider } from './contexts/AuthContext';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import { AppContainer } from './shared/components';

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

function App() {
  return (
    <MantineProvider theme={theme}>
      <AuthProvider>
        <Notifications
          position='bottom-center'
          containerWidth='max-content'
        />
        <AppContainer>
          <RouterProvider router={router} />
        </AppContainer>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;
