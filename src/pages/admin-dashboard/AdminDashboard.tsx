import { Stack, Group, Title, ActionIcon, Text, Center } from '@mantine/core';
import { Activity } from 'react';
import { Navigate, Outlet } from 'react-router';
import { MembersProvider, FormStoreProvider, useAuth } from '../../contexts';
import { ACTION_BUTTON_SIZE, ACTION_ICON_SIZE, PATHNAME } from '../../data/types';
import { ErrorAlert, GroupSpaceApart, MyAvatar, ErrorBoundary, SuspenseBox, LoadingBox } from '../../shared/components';
import { useRefreshKey, useMyNavigation } from '../../shared/hooks';
import { IconArrowBack } from '../../shared/icons';
import { TabNavigation } from '../tab-navigation/TabNavigation';
import { AdminMenu } from './components/AdminMenu';
import { useFormStore } from './hooks/useFormStore';
import { TITLES } from './types/index.d';
import { GoogleIcon } from '../../shared/icons/factory';

const useAdminDashboardContent = () => {
    const [refreshKey, updateRefreshKey] = useRefreshKey();
    const { user, isAuthState } = useAuth();
    const {
        pathname,
        isHome,
        paramMemberAction,
        actions: { goBack }
    } = useMyNavigation();

    const pageTitle =
        paramMemberAction === 'edit' ? 'Edit Member'
        : paramMemberAction === 'reactivate' ? 'Reactivate Member'
        : TITLES[pathname].title;

    const { hasErrors, errorFormNames, clearFormStates } = useFormStore();

    const hasMoreNames = errorFormNames.length > 1;
    const firstMemberName = errorFormNames[0];
    const errorMemberName = hasMoreNames ? `${firstMemberName} and ${errorFormNames.length - 1} more` : firstMemberName;
    const errorMessage = `${errorMemberName} has failed ${hasMoreNames ? 'transactions' : 'transaction'}!`;

    return {
        refreshKey,
        user,
        isAuthState,
        pageTitle,
        isHome,
        hasErrors,
        errorMessage,
        actions: {
            goBack,
            clearFormStates,
            getMode: (isVisible: boolean) => (isVisible ? 'visible' : 'hidden'),
            handleRefreshKey: updateRefreshKey
        }
    };
};

const AdminDashboardContent = () => {
    const {
        refreshKey,
        user,
        isAuthState,
        pageTitle,
        isHome,
        hasErrors,
        errorMessage,
        actions: { goBack, getMode, clearFormStates, handleRefreshKey }
    } = useAdminDashboardContent();

    if (!isAuthState) {
        return (
            <Center h='100vh' style={{ gap: 4 }}>
                <GoogleIcon iconName='safety_check' size={48} fw={300} />
                <Title order={4} fw={300}>
                    Authenticating…
                </Title>
            </Center>
        );
    }

    if (!user) return <Navigate to={PATHNAME.signin} replace />;

    console.log('🎨 Rendering Admin Dashboard', hasErrors);

    return (
        <>
            {/* Browser Tab title dynamically changes based on current route */}
            <title>{pageTitle}</title>

            {/* Header */}
            <Stack p='md'>
                <ErrorAlert message={errorMessage} visible={hasErrors} withCloseButton onClose={clearFormStates} />

                <GroupSpaceApart h={48}>
                    <Group>
                        {isHome ?
                            <>
                                <MyAvatar name={user?.displayName || 'Admin'} src={user?.photoURL} size='md' />
                                <Stack gap={0}>
                                    <Title order={6}>{user?.displayName || 'Admin'}</Title>
                                    <Text size='xs' c='dimmed'>
                                        {user?.email}
                                    </Text>
                                </Stack>
                            </>
                        :   <>
                                <ActionIcon color='gray.1' variant='filled' size={ACTION_BUTTON_SIZE} onClick={goBack}>
                                    <IconArrowBack size={ACTION_ICON_SIZE} emphasize />
                                </ActionIcon>
                                <Title order={3}>{pageTitle}</Title>
                            </>
                        }
                    </Group>

                    <AdminMenu />
                </GroupSpaceApart>

                {/* Tabs */}
                <Activity mode={getMode(isHome)}>
                    <TabNavigation />
                </Activity>

                {/* Outlet */}
                <Activity mode={getMode(!isHome)}>
                    <ErrorBoundary onRetry={handleRefreshKey}>
                        <SuspenseBox>
                            <Outlet key={refreshKey + pageTitle} />
                        </SuspenseBox>
                    </ErrorBoundary>
                </Activity>
            </Stack>
        </>
    );
};

export default function AdminDashboard() {
    const [refreshKey, setRefreshKey] = useRefreshKey();

    return (
        <ErrorBoundary onRetry={setRefreshKey}>
            <SuspenseBox>
                <MembersProvider>
                    <FormStoreProvider>
                        <AdminDashboardContent key={refreshKey} />
                    </FormStoreProvider>
                </MembersProvider>
            </SuspenseBox>
        </ErrorBoundary>
    );
}
