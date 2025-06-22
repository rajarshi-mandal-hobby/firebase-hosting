import React from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Box,
  rem,
  Accordion,
  Badge,
  List,
  Code,
} from "@mantine/core";
import { IconShieldCheck, IconTestPipe } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";
import { notifications } from "@mantine/notifications";

const GoogleIcon = () => (
  <img
    src='https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg'
    alt='Google'
    width={18}
    height={18}
    style={{ display: "block" }}
  />
);

const SignIn: React.FC = () => {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      notifications.show({
        title: "Welcome!",
        message: "You have signed in successfully!",
        color: "green",
      });
    } catch (error) {
      console.error("Sign-in error:", error);
      notifications.show({
        title: "Error",
        message: "Failed to sign in. Please try again.",
        color: "red",
      });
    }
  };

  return (
    <Container size='sm' style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Paper shadow='md' radius='lg' p='xl' style={{ width: "100%", maxWidth: rem(450), margin: "0 auto" }}>
        <Stack gap='lg' align='center'>
          <Box ta='center'>
            <Group justify='center' mb='xs'>
              <IconShieldCheck size={40} color='var(--mantine-color-blue-6)' />
            </Group>
            <Title order={1} c='blue.6' mb='xs'>
              Rajarshi Mess
            </Title>
            <Text c='dimmed' size='sm' mb='lg'>
              Sign in to access your account and manage your mess services
            </Text>
          </Box>
          <Stack gap='md' style={{ width: "100%" }}>
            <Button
              variant='outline'
              size='lg'
              leftSection={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              fullWidth
              color='blue'
              styles={{
                root: {
                  borderWidth: rem(2),
                  fontSize: rem(16),
                  height: rem(50),
                },
              }}>
              Sign in with Google
            </Button>
          </Stack>{" "}
          <Text size='xs' c='dimmed' ta='center' maw={rem(350)}>
            By signing in, you agree to our terms of service and privacy policy.
          </Text>
          {/* Development Testing Information */}
          {import.meta.env.DEV && (
            <Accordion variant='contained' style={{ width: "100%" }}>
              <Accordion.Item value='test-users'>
                <Accordion.Control icon={<IconTestPipe size={16} />}>
                  <Group>
                    <Text size='sm'>Test Users</Text>
                    <Badge size='xs' color='blue'>
                      Development
                    </Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap='sm'>
                    <Text size='sm' fw={500}>
                      Admin Users (Direct Access):
                    </Text>
                    <List size='xs' spacing='xs'>
                      <List.Item>
                        <Code>rajarshhi@gmail.com</Code>
                      </List.Item>
                      <List.Item>
                        <Code>admin@rajarshi-mess.com</Code>
                      </List.Item>
                    </List>

                    <Text size='sm' fw={500} mt='sm'>
                      Regular Users (Phone Verification):
                    </Text>
                    <List size='xs' spacing='xs'>
                      <List.Item>
                        <Code>user1@example.com</Code> - John Doe
                      </List.Item>
                      <List.Item>
                        <Code>user2@example.com</Code> - Jane Smith
                      </List.Item>
                      <List.Item>
                        <Code>user3@example.com</Code> - Mike Johnson
                      </List.Item>
                      <List.Item>
                        <Code>user4@example.com</Code> - Sarah Wilson
                      </List.Item>
                    </List>

                    <Text size='xs' c='dimmed' mt='sm'>
                      For phone verification, use any +91 number and OTP: <Code>123456</Code>
                    </Text>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default SignIn;
