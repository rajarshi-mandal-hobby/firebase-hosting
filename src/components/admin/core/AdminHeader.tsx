// Admin Header Component - Displays admin info and logout button
import React from "react";
import { Paper, Text, Button, Group, Avatar, Box } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../../../hooks/useAuth";

const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      notifications.show({
        title: "Signed Out",
        message: "You have been successfully signed out.",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to sign out. Please try again.",
        color: "red",
      });
    }
  };

  return (
    <Paper shadow="xs" p="md" mb="md" radius="md">
      <Group justify="space-between">
        <Group>
          <Avatar size="md" color="blue">
            {user?.displayName?.charAt(0)?.toUpperCase() || "A"}
          </Avatar>
          <Box>
            <Text size="sm" fw={600}>
              {user?.displayName || "Admin"}
            </Text>
            <Text size="xs" c="dimmed">
              Administrator
            </Text>
          </Box>
        </Group>
        <Button
          variant="subtle"
          color="red"
          size="xs"
          leftSection={<IconLogout size={14} />}
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </Group>
    </Paper>
  );
};

export default AdminHeader;
