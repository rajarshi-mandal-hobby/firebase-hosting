import { Menu, ActionIcon } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { IconMoreVertical, IconRupee, IconLogout } from '../../../../shared/icons';
import { ACTION_BUTTON_SIZE, ACTION_ICON_SIZE, NAVIGATE } from '../../../../data/types';

export const AdminMenu = () => {
    const { logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const pathsToPage: Record<string, string> = {
        [NAVIGATE.ADD_MEMBER.path]: NAVIGATE.ADD_MEMBER.name,
        [NAVIGATE.GENERATE_BILLS.path]: NAVIGATE.GENERATE_BILLS.name
    } as const;

    const pathsToPageArray = Object.entries(pathsToPage);

    // Navigate to home if not already on home
    // Replace the current history entry if not already on home
    const navigateToHome = (path: keyof typeof pathsToPage) =>
        navigate(path, { replace: location.pathname !== NAVIGATE.HOME.path });

    return (
        <Menu>
            <Menu.Target>
                <ActionIcon color='gray.1' variant='filled' size={ACTION_BUTTON_SIZE}>
                    <IconMoreVertical size={ACTION_ICON_SIZE} />
                </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
                {pathsToPageArray
                    .filter(([path]) => location.pathname !== path)
                    .map(([path, label]) => (
                        <Menu.Item key={label} onClick={() => navigateToHome(path)}>
                            {label}
                        </Menu.Item>
                    ))}
                <Menu.Divider />
                {location.pathname !== NAVIGATE.DEFAULT_RENTS.path && (
                    <Menu.Item
                        leftSection={<IconRupee size={14} />}
                        onClick={() => navigateToHome(NAVIGATE.DEFAULT_RENTS.path)}
                    >
                        {NAVIGATE.DEFAULT_RENTS.name}
                    </Menu.Item>
                )}
                <Menu.Item color='red' onClick={logout} leftSection={<IconLogout size={14} />}>
                    Sign Out
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};
