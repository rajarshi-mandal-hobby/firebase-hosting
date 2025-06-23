import React from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Avatar,
  Box,
  Badge,
} from "@mantine/core";
import { IconLogout, IconSettings, IconDashboard } from "@tabler/icons-react";
import { useAuth } from "../hooks/useAuth";
import { notifications } from "@mantine/notifications";

const Dashboard: React.FC = () => {
  const { user, userProfile, logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
      notifications.show({
        title: "Goodbye!",
        message: "You have been signed out successfully.",
        color: "blue",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to sign out. Please try again.",
        color: "red",
      });
    }
  };

  const isAdmin = userProfile?.isAdmin || false;

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" radius="lg" p="xl">
        <Stack gap="lg">
          <Group justify="space-between">
            <Group>
              <Avatar
                src={user?.photoURL ?? null}
                alt={user?.displayName || "User"}
                size="lg"
                radius="xl"
              />
              <Box>
                <Title order={3}>Welcome back!</Title>
                <Text c="dimmed">{user?.displayName || "User"}</Text>
                <Text size="sm" c="dimmed">
                  {user?.email}
                </Text>
              </Box>
            </Group>
            <Group>
              {isAdmin && (
                <Badge color="blue" variant="light" size="lg">
                  <IconSettings size={14} style={{ marginRight: 4 }} />
                  Admin
                </Badge>
              )}
              <Button
                variant="outline"
                color="red"
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </Group>
          </Group>
          <Paper
            shadow="xs"
            p="md"
            radius="md"
            style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
          >
            <Stack gap="md">
              <Group>
                <IconDashboard size={24} color="var(--mantine-color-blue-6)" />
                <Title order={4}>Dashboard</Title>
              </Group>
              <Text>
                {isAdmin
                  ? "Welcome to the admin dashboard! You have administrative privileges to manage the system."
                  : "Welcome to your user dashboard! Access your personal features and settings here."}
              </Text>
            </Stack>
          </Paper>
          {isAdmin && (
            <Paper
              shadow="xs"
              p="md"
              radius="md"
              style={{ backgroundColor: "var(--mantine-color-blue-0)" }}
            >
              <Title order={5} mb="sm">
                Admin Functions
              </Title>
              <Text size="sm" c="dimmed">
                Admin-specific features and controls will be available here.
              </Text>
            </Paper>
          )}{" "}
          <Paper
            shadow="xs"
            p="md"
            radius="md"
            style={{ backgroundColor: "var(--mantine-color-green-0)" }}
          >
            <Title order={5} mb="sm">
              Account Status
            </Title>
            <Stack gap="xs">
              <Text size="sm">
                <strong>Email:</strong> {user?.email}
              </Text>
              {userProfile?.phoneNumber && (
                <Text size="sm">
                  <strong>Phone:</strong> {userProfile.phoneNumber} ✅
                </Text>
              )}
              <Text size="sm">
                <strong>Account Type:</strong>{" "}
                {isAdmin ? "Administrator" : "Regular User"}
              </Text>
              <Text size="sm" c="dimmed">
                You are currently connected to Firebase emulators for local
                development. Authentication, Firestore, and Storage are running
                locally.
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Dashboard;
