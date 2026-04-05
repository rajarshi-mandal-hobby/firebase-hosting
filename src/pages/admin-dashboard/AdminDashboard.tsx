import { Menu, ActionIcon, Stack, Title, Text } from '@mantine/core';
import { Activity, useEffect } from 'react';
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

    const entries = Object.entries(Titles);
    const menuItems = entries.filter(
        ([p]) => p !== '/' && p !== 'member-details' && p !== 'default-rents' && p !== path
    ) as [Path, string][];

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

            <Menu.Dropdown onTransitionEnd={() => console.log('I am clicked')}>
                {menuItems.map(([p, label]) => (
                    <Menu.Item key={p} leftSection={getIcon(p)} component={Link} to={p} replace={path !== '/'}>
                        {label}
                    </Menu.Item>
                ))}
                <Menu.Divider />
                {path !== 'default-rents' && (
                    <Menu.Item
                        leftSection={getIcon('default-rents')}
                        component={Link}
                        to='default-rents'
                        replace={path !== '/'}
                    >
                        {Titles['default-rents']}
                    </Menu.Item>
                )}
                <Menu.Item onClick={handleLogout} leftSection={<IconLogout color='red' />}>
                    Sign Out
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};

export const AdminDashboardContainer = () => {
    const user = useUser();
    const [refreshKey, setRefreshKey] = useRefreshKey();
    const { path, getMode, goBack, memberAction } = useMyNavigation();
    const viewTitle =
        memberAction === 'edit-member' ? 'Edit Member'
        : memberAction === 'reactivate-member' ? 'Reactivate Member'
        : Titles[path];

    console.log('🎨 Rendering AdminDashboard');

    return (
        <>
            <title>{viewTitle.toString()}</title>
            <Stack p='md'>
                <GroupSpaceApart h={48}>
                    <GroupIcon gap='md'>
                        {path === '/' ?
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
                    <AdminMenu path={path} />
                </GroupSpaceApart>

                {/* Components stay alive because they are always in the DOM */}

                <Activity mode={getMode(path)}>
                    <TabNavigation />
                </Activity>

                {/* <Activity mode={getMode('default-rents')}>
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
            </Activity> */}

                {/* <DefaultRentsProvider> */}
                    <RentsProvider>
                        <ErrorBoundary onRetry={setRefreshKey}>
                            <SuspenseBox>
                                <Outlet key={refreshKey} />
                            </SuspenseBox>
                        </ErrorBoundary>
                    </RentsProvider>
                {/* </DefaultRentsProvider> */}
            </Stack>
        </>
    );
};

export const AdminDashboard = () => {
    const [refreshKey, setRefreshKey] = useRefreshKey();

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
        <ErrorBoundary onRetry={setRefreshKey}>
            <SuspenseBox>
                <MembersProvider>
                    <FormStoreProvider>
                        <AdminDashboardContainer key={refreshKey} />
                    </FormStoreProvider>
                </MembersProvider>
            </SuspenseBox>
        </ErrorBoundary>
    );
};
