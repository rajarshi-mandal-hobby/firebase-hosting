import {
  TextInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Title,
  SimpleGrid,
  Divider,
  Text,
  ActionIcon,
  Accordion,
  Loader,
} from '@mantine/core';
import { useState, useEffect } from 'react';
// import { IconTrash } from '@tabler/icons-react';
import { ConfigService } from '../../../contexts/services';
import type { GlobalSettings, AdminConfig } from '../../../shared/types/firestore-types';

export function ConfigManagement() {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [settingsData, adminData] = await Promise.all([
          ConfigService.getGlobalSettings(),
          ConfigService.getAdminConfig(),
        ]);
        setGlobalSettings(settingsData);
        setAdminConfig(adminData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load configuration data');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  if (loading) {
    return (
      <Stack gap='lg' align='center'>
        <Loader size='lg' />
        <Text>Loading configuration...</Text>
      </Stack>
    );
  }

  if (error || !globalSettings || !adminConfig) {
    return (
      <Stack gap='lg' align='center'>
        <Text c='red'>Error: {error || 'Failed to load configuration data'}</Text>
        <Button onClick={() => window.location.reload()} variant='outline'>
          Retry
        </Button>
      </Stack>
    );
  }

  // Get primary admin (first in the list)
  const primaryAdmin = adminConfig.list[0];

  return (
    <Stack gap='lg'>
      {/* Admin Management - Collapsible and at the top */}
      <Accordion variant='contained' defaultValue={null}>
        <Accordion.Item value='admin-management'>
          <Accordion.Control>
            <Title order={3} mb={0} style={{ fontWeight: 600 }}>
              Admin Management
            </Title>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap='md'>
              {/* Current Admins */}
              <div>
                <Title order={4} mb='sm'>
                  Current Admins
                </Title>
                <Stack gap='xs'>
                  <Group justify='space-between' p='sm' bg='gray.0' style={{ borderRadius: '8px' }}>
                    <div>
                      <Text size='sm' fw={500}>
                        {primaryAdmin.email.split('@')[0]}
                      </Text>
                      <Text size='xs' c='dimmed'>
                        {primaryAdmin.email}
                      </Text>
                      <Text size='xs' c='blue'>
                        Primary Admin (You)
                      </Text>
                    </div>
                    <Text size='xs' c='dimmed'>
                      Cannot remove
                    </Text>
                  </Group>

                  {adminConfig.list.length > 1 && (
                    <Group justify='space-between' p='sm' bg='gray.0' style={{ borderRadius: '8px' }}>
                      <div>
                        <Text size='sm' fw={500}>
                          Secondary Admin
                        </Text>
                        <Text size='xs' c='dimmed'>
                          admin2@example.com
                        </Text>
                        <Text size='xs' c='orange'>
                          Secondary Admin
                        </Text>
                      </div>
                      <ActionIcon variant='subtle' color='red' size='sm'>
                        {/* <IconTrash size={16} /> */}
                      </ActionIcon>
                    </Group>
                  )}
                </Stack>
              </div>

              <Divider />

              {/* Add New Admin */}
              <div>
                <Title order={4} mb='sm'>
                  Add New Admin
                </Title>
                <Group align='flex-end' gap='md'>
                  <TextInput label='Email Address' placeholder='admin@example.com' style={{ flex: 1 }} size='sm' />
                  <Button size='sm'>Add Admin</Button>
                </Group>
              </div>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {/* System Configuration - No Paper, restructured */}
      <Stack gap='md'>
        {/* 2nd Floor */}
        <Title order={4} mb='sm'>
          2nd Floor
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
          <NumberInput label='Bed Rent' defaultValue={globalSettings.bedTypes['2nd'].Bed} leftSection='₹' size='sm' />
          <NumberInput label='Room Rent' defaultValue={globalSettings.bedTypes['2nd'].Room} leftSection='₹' size='sm' />
          <NumberInput
            label='Special Rent'
            defaultValue={globalSettings.bedTypes['2nd'].Special}
            leftSection='₹'
            size='sm'
          />
        </SimpleGrid>
        <Divider />

        {/* 3rd Floor */}
        <Title order={4} mb='sm'>
          3rd Floor
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
          <NumberInput label='Bed Rent' defaultValue={globalSettings.bedTypes['3rd'].Bed} leftSection='₹' size='sm' />
          <NumberInput label='Room Rent' defaultValue={globalSettings.bedTypes['3rd'].Room} leftSection='₹' size='sm' />
          {/* Empty div to maintain grid alignment */}
          <div></div>
        </SimpleGrid>
        <Divider />

        {/* General Settings */}
        <Title order={4} mb='sm'>
          General Settings
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
          <NumberInput
            label='Security Deposit'
            defaultValue={globalSettings.securityDeposit}
            leftSection='₹'
            size='sm'
          />
          <NumberInput
            label='WiFi Monthly Charge'
            defaultValue={globalSettings.wifiMonthlyCharge}
            leftSection='₹'
            size='sm'
          />
          <TextInput label='UPI VPA' defaultValue={globalSettings.upiVpa} size='sm' />
        </SimpleGrid>
        <Group justify='flex-end' mt='md'>
          <Button variant='default' size='sm'>
            Reset
          </Button>
          <Button size='sm'>Save System Settings</Button>
        </Group>
      </Stack>
    </Stack>
  );
}
