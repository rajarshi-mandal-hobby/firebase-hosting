import { Menu, ActionIcon, Stack, Title, Text } from '@mantine/core';
import { Activity } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ACTION_BUTTON_SIZE, ACTION_ICON_SIZE } from '../../data/types';
import { LoadingBox, GroupSpaceApart, GroupIcon, MyAvatar, ErrorBoundary, SuspenseBox } from '../../shared/components';
import { type View, Views, useMyNavigation } from '../../shared/hooks/useNavigation';
import { useRefreshKey } from '../../shared/hooks/useRefreshKey';
import { IconMoreVertical, IconRupee, IconLogout, IconBack, IconReceiptLong, IconPersonAdd } from '../../shared/icons';
import { lazyImport } from '../../shared/utils';
import { TabNavigation } from './components/tab-navigation/TabNavigation';

// Lazy Imports
const DefaultRentsPage = lazyImport(() => import('./components/default-rents/DefaultRentsPage'), 'DefaultRentsPage');
const GenerateBillsPage = lazyImport(
    () => import('./components/generate-bills/GenerateBillsPage'),
    'GenerateBillsPage'
);
const MemberFormPage = lazyImport(() => import('./components/member-form/MemberFormPage'), 'MemberFormPage');
const MemberDetailsPage = lazyImport(() => import('./components/member-details/MemberDetails'), 'MemberDetailsPage');

interface AdminMenuProps {
    view: View;
    navigateTo: (newView: View) => void;
}

const getIcon = (label: View) => {
    switch (label) {
        case 'generate-bills':
            return <IconReceiptLong />;
        case 'member-action':
            return <IconPersonAdd />;
        case 'default-rents':
            return <IconRupee />;
        default:
            return null;
    }
};

const AdminMenu = ({ view, navigateTo }: AdminMenuProps) => {
    const { logout } = useAuth();

    return (
        <Menu>
            <Menu.Target>
                <ActionIcon color='gray.1' variant='filled' size={ACTION_BUTTON_SIZE}>
                    <IconMoreVertical size={ACTION_ICON_SIZE} />
                </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
                {Object.entries(Views)
                    .filter(([path]) => view !== path && path !== 'default-rents' && path !== 'home')
                    .map(([path, label]) => (
                        <Menu.Item
                            key={path}
                            leftSection={getIcon(path as View)}
                            onClick={() => navigateTo(path as View)}
                        >
                            {label}
                        </Menu.Item>
                    ))}
                <Menu.Divider />
                {view !== 'default-rents' && (
                    <Menu.Item leftSection={getIcon('default-rents')} onClick={() => navigateTo('default-rents')}>
                        {Views['default-rents']}
                    </Menu.Item>
                )}
                <Menu.Item color='red' onClick={logout} leftSection={<IconLogout />}>
                    Sign Out
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};

export const AdminDashboardContainer = () => {
    const { user, loading } = useAuth();
    const { view, getMode, goBack, navigateTo, memberAction } = useMyNavigation();
    const viewTitle =
        memberAction === 'edit-member' ? 'Edit Member'
        : memberAction === 'reactivate-member' ? 'Reactivate Member'
        : Views[view];

    if (loading) return <LoadingBox />;

    console.log('🎨 Rendering AdminDashboard');

    return (
        <Stack p='md'>
            <GroupSpaceApart h={48}>
                <GroupIcon gap='md'>
                    {view === 'home' ?
                        <>
                            <MyAvatar name={user?.displayName || 'Admin'} src={user?.photoURL} size='md' />
                            <Stack gap={0}>
                                <Title order={4}>{user?.displayName || 'Admin'}</Title>
                                <Text size='xs' c='dimmed'>
                                    {user?.email}
                                </Text>
                            </Stack>
                        </>
                    :   <>
                            <ActionIcon color='gray.1' variant='filled' size={ACTION_BUTTON_SIZE} onClick={goBack}>
                                <IconBack size={ACTION_ICON_SIZE} />
                            </ActionIcon>
                            <Title order={3}>{viewTitle}</Title>
                        </>
                    }
                </GroupIcon>
                <AdminMenu view={view} navigateTo={navigateTo} />
            </GroupSpaceApart>

            {/* Components stay alive because they are always in the DOM */}

            <Activity mode={getMode('home')}>
                <TabNavigation />
            </Activity>

            <Activity mode={getMode('default-rents')}>
                <DefaultRentsPage />
            </Activity>

            <Activity mode={getMode('generate-bills')}>
                <GenerateBillsPage />
            </Activity>

            <Activity mode={getMode('member-action')}>
                <MemberFormPage />
            </Activity>

            <Activity mode={getMode('member-details')}>
                <MemberDetailsPage />
            </Activity>
        </Stack>
    );
};

export const AdminDashboard = () => {
    const [refreshKey, setRefreshKey] = useRefreshKey();
    return (
        <ErrorBoundary onRetry={setRefreshKey}>
            <SuspenseBox>
                <AdminDashboardContainer key={refreshKey} />
            </SuspenseBox>
        </ErrorBoundary>
    );
};
