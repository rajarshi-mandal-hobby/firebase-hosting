import { Text, Stack, Title, ActionIcon, Menu } from '@mantine/core';
import { useAuth } from '../../../contexts/AuthContext';
import { GroupIcon, GroupSpaceApart, LoadingBox, MyAvatar } from '../../../shared/components';
import { TabNavigation } from '../tab-navigation/TabNavigation';
import { ACTION_BUTTON_SIZE, ACTION_ICON_SIZE } from '../../../data/types';
import { IconMoreVertical, IconRupee, IconLogout, IconBack } from '../../../shared/icons';
import { Activity } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { lazyImport } from '../../../shared/utils';
const DefaultRentsPage = lazyImport(() => import('../default-rents/components/DefaultRentsPage'), 'DefaultRentsPage');
const GenerateBillsPage = lazyImport(
    () => import('../generate-bills/components/GenerateBillsPage'),
    'GenerateBillsPage'
);
const MemberFormPage = lazyImport(() => import('../add-member/components/MemberFormPage'), 'MemberFormPage');

const Views = {
    home: 'Home',
    'member-action': 'Add Member',
    'generate-bills': 'Generate Bills',
    'default-rents': 'Default Rents'
} as const;

type View = keyof typeof Views;

export type MemberAction = 'add' | 'edit' | 'reactivate';

export const useNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // 1. Cleaner path detection
    const view = (location.pathname === '/' ? 'home' : location.pathname.substring(1)) as View;
    const memberAction = searchParams.get('action') as MemberAction | null;

    const navigateTo = (
        newView: View,
        { memberid, action }: { memberid?: string | null; action?: MemberAction | null } = {}
    ) => {
        const path = newView === 'home' ? '/' : `/${newView}`;

        // 2. Clone current params to modify them without affecting current state prematurely
        const nextParams = new URLSearchParams(searchParams);

        if (newView === 'member-action') {
            if (memberid) {
                nextParams.set('id', memberid);
                if (action) nextParams.set('action', action);
            } else {
                nextParams.set('action', 'add');
            }
        } else {
            // Optional: Clear member params when leaving 'add-member'
            nextParams.delete('id');
            nextParams.delete('action');
        }

        navigate(
            {
                pathname: path,
                search: nextParams.toString()
            },
            {
                viewTransition: true,
                replace: view !== 'home'
            }
        );
    };

    const goBack = () => navigate(-1);
    const getMode = (path: View) => (view === path ? 'visible' : 'hidden');

    return { navigateTo, goBack, getMode, view, memberAction };
};

interface AdminMenuProps {
    view: View;
    navigateTo: (newView: View) => void;
}

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
                        <Menu.Item key={path} onClick={() => navigateTo(path as View)}>
                            {label}
                        </Menu.Item>
                    ))}
                <Menu.Divider />
                {view !== 'default-rents' && (
                    <Menu.Item leftSection={<IconRupee size={14} />} onClick={() => navigateTo('default-rents')}>
                        {Views['default-rents']}
                    </Menu.Item>
                )}
                <Menu.Item color='red' onClick={logout} leftSection={<IconLogout size={14} />}>
                    Sign Out
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};

export function AdminDashboard() {
    const { user, loading } = useAuth();
    const { view, getMode, goBack, navigateTo, memberAction } = useNavigation();
    const viewTitle =
        memberAction === 'edit' ? 'Edit Member'
        : memberAction === 'reactivate' ? 'Reactivate Member'
        : Views[view];

    if (loading) return <LoadingBox />;

    console.log('🎨 Rendering AdminDashboard', view, memberAction);

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

            {/* <Outlet /> */}
        </Stack>
    );
}
