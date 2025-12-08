import { Menu, ActionIcon, em } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { IconMoreVertical, IconRupee, IconLogout } from '../../../../shared/icons';

export const AdminMenu = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pathsToPage: { [key: string]: string } = {
    '/add-member/': 'Add Member',
    '/generate-bills/': 'Generate Bills',
    '/': 'Admin Dashboard',
  };

  return (
    <Menu>
      <Menu.Target>
        <ActionIcon color='gray.1' variant='filled' size={32} autoContrast>
          <IconMoreVertical size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {Object.entries(pathsToPage).map(([path, label]) => {
          if (location.pathname === path) return null;
          return (
            <Menu.Item key={path} onClick={() => navigate(path, { replace: true })}>
              {label}
            </Menu.Item>
          );
        })}
        <Menu.Divider />
        {location.pathname !== '/default-rents' && (
          <Menu.Item
            leftSection={<IconRupee size={14} />}
            onClick={() => navigate('/default-rents', { replace: true })}>
            Default Rents
          </Menu.Item>
        )}
        <Menu.Item color='red' onClick={logout} leftSection={<IconLogout size={14} />}>
          Sign Out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
