import { Menu, ActionIcon, Stack, Title, Text } from '@mantine/core';
import { Activity, Fragment, useEffect } from 'react';
import { ACTION_BUTTON_SIZE, ACTION_ICON_SIZE } from '../../data/types';
import { GroupSpaceApart, GroupIcon, MyAvatar, ErrorBoundary, SuspenseBox } from '../../shared/components';
import { useMyNavigation, type Path } from '../../shared/hooks/useNavigation';
import { useRefreshKey } from '../../shared/hooks/useRefreshKey';
import { IconMoreVertical, IconRupee, IconLogout, IconBack, IconReceiptLong, IconPersonAdd } from '../../shared/icons';
import { TabNavigation } from './components/tab-navigation/TabNavigation';
import { Link, Outlet, replace, useSubmit } from 'react-router';
import { onAuthStateChanged } from 'firebase/auth';
import { FormStoreProvider, MembersProvider, RentsProvider, useUser } from '../../contexts';
import { auth } from '../../firebase';

export const Titles: Record<Path, string> = {
    '/': 'Rajarshi Mess',
    'member-action': 'Add Member',
    'generate-bills': 'Generate Bills',
    'default-rents': 'Default Rents',
    'member-details': 'Member Details'
} as const;

export type Title = keyof typeof Titles;

const useAdminMenu = (path: Path) => {
    const submit = useSubmit();
    const handleLogout = async () => submit({ intent: 'logout' }, { method: 'post', action: '/signin', replace: true });

    const menuEntries = Object.entries(Titles) as [Path, string][];
    const menuItems = menuEntries.filter(([p]) => p !== '/' && p !== 'member-details' && p !== path);

    const getIcon = (path: Path) => {
        switch (path) {
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

    return { menuItems, handleLogout, getIcon };
};

const AdminMenu = ({ path }: { path: Path }) => {
    const { menuItems, handleLogout, getIcon } = useAdminMenu(path);

    return (
        <Menu>
            <Menu.Target>
                <ActionIcon color='gray.1' variant='filled' size={ACTION_BUTTON_SIZE}>
                    <IconMoreVertical size={ACTION_ICON_SIZE} />
                </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
                {menuItems.map(([p, label]) => (
                    <Fragment key={`admin_menu_${label}`}>
                        {p === 'default-rents' && <Menu.Divider />}
                        <Menu.Item leftSection={getIcon(p)} component={Link} to={p} replace={path !== '/'}>
                            {label}
                        </Menu.Item>
                    </Fragment>
                ))}
                <Menu.Divider />
                <Menu.Item onClick={handleLogout} leftSection={<IconLogout color='red' />}>
                    Sign Out
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};

export const AdminDashboard = () => {
    const [refreshKey, setRefreshKey] = useRefreshKey();
    const user = useUser();
    const { path, goBack, memberAction } = useMyNavigation();
    const viewTitle =
        memberAction === 'edit-member' ? 'Edit Member'
        : memberAction === 'reactivate-member' ? 'Reactivate Member'
        : Titles[path];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                replace('/signin');
            }
        });
        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <>
            <title>{Titles[path]}</title>
            <ErrorBoundary onRetry={setRefreshKey}>
                <SuspenseBox>
                    <MembersProvider>
                        <FormStoreProvider>
                            <Stack p='md'>
                                <GroupSpaceApart h={48}>
                                    <GroupIcon gap='md'>
                                        {path === '/' ?
                                            <>
                                                <MyAvatar
                                                    name={user.displayName || 'Admin'}
                                                    src={user.photoURL}
                                                    size='md'
                                                />
                                                <Stack gap={0}>
                                                    <Title order={4}>{user.displayName || 'Admin'}</Title>
                                                    <Text size='xs' c='dimmed'>
                                                        {user.email}
                                                    </Text>
                                                </Stack>
                                            </>
                                        :   <>
                                                <ActionIcon
                                                    color='gray.1'
                                                    variant='filled'
                                                    size={ACTION_BUTTON_SIZE}
                                                    onClick={goBack}
                                                >
                                                    <IconBack size={ACTION_ICON_SIZE} />
                                                </ActionIcon>
                                                <Title order={3}>{viewTitle}</Title>
                                            </>
                                        }
                                    </GroupIcon>
                                    <AdminMenu path={path} />
                                </GroupSpaceApart>

                                <Activity mode={path === '/' ? 'visible' : 'hidden'}>
                                    <TabNavigation />
                                </Activity>

                                <RentsProvider>
                                    <Activity mode={path === '/' ? 'hidden' : 'visible'}>
                                        <ErrorBoundary onRetry={setRefreshKey}>
                                            <SuspenseBox>
                                                <Outlet key={refreshKey} />
                                            </SuspenseBox>
                                        </ErrorBoundary>
                                    </Activity>
                                </RentsProvider>
                            </Stack>
                        </FormStoreProvider>
                    </MembersProvider>
                </SuspenseBox>
            </ErrorBoundary>
        </>
    );
};
