import { Menu, ActionIcon } from '@mantine/core';
import { Link } from 'react-router';
import { Fragment } from 'react/jsx-runtime';
import {
    type Pathname,
    ACTION_BUTTON_SIZE,
    ACTION_ICON_SIZE,
    MEMBER_ACTION_QUERY,
    PATHNAME
} from '../../../data/types';
import { IconMoreVert, IconLogout } from '../../../shared/icons';
import { TITLES, type TitlesMap } from '../types/index.d';
import { useMyNavigation } from '../../../shared/hooks';
import { useAuth } from '../../../contexts';

const useAdminMenu = () => {
    const { pathname, isHome } = useMyNavigation();
    const { handleSignOut } = useAuth();
    const menuItems = Object.entries(TITLES).filter(
        ([p]) => !(p === PATHNAME.home || p === PATHNAME.signin || p === PATHNAME.member_details || p === pathname)
    ) as [Pathname, TitlesMap][];

    return {
        menuItems,
        pathname,
        isHome,
        handleSignOut
    };
};

export const AdminMenu = () => {
    const { menuItems, isHome, handleSignOut } = useAdminMenu();

    return (
        <Menu>
            <Menu.Target>
                <ActionIcon color='gray.1' variant='filled' size={ACTION_BUTTON_SIZE}>
                    <IconMoreVert size={ACTION_ICON_SIZE} />
                </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
                {menuItems.map(([p, { title, Icon }]) => (
                    <Fragment key={`admin_menu_${p}`}>
                        {p === PATHNAME.default_rents && <Menu.Divider />}
                        <Menu.Item
                            leftSection={Icon}
                            component={Link}
                            to={p === PATHNAME.member_action ? MEMBER_ACTION_QUERY.add : p}
                            replace={!isHome}
                            viewTransition
                        >
                            {title}
                        </Menu.Item>
                    </Fragment>
                ))}
                <Menu.Divider />
                <Menu.Item onClick={handleSignOut} leftSection={<IconLogout c='red' />}>
                    Sign Out
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};
