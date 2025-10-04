import {
  Button,
  Divider,
  Group,
  Loader,
  LoadingOverlay,
  SimpleGrid,
  Stack,
  TextInput,
  Title,
  Box,
} from '@mantine/core';
import { Suspense } from 'react';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import { zStringTrimmed } from '../../../../utils/validators';
import { GlobalSettings } from '../../../../data/shemas/GlobalSettings';
import { ErrorBoundary } from '../../../../shared/components/index.ts';
import { ConfigSkeleton } from './ConfigSkeleton.tsx';
import { useSettings } from '../hooks/useSettings.ts';
import { useConfigForm } from '../hooks/useConfigForm.ts';

export const ConfigManagement = () => {
  const { settings, loading, error, refreshKey, actions } = useSettings();

  console.log('🎨 Rendering ConfigManagement');
  if ((!settings || loading) && !error) {
    // Initial loading state
    return <ConfigSkeleton />;
  }

  return (
    <ErrorBoundary onRetry={actions.handleRetry}>
      <Suspense fallback={null}>
        <ConfigFormContainer key={refreshKey} settings={settings} error={error} handleRefresh={actions.handleRefresh} />
      </Suspense>
    </ErrorBoundary>
  );
};

function ConfigFormContainer({
  settings,
  error,
  handleRefresh,
}: {
  settings: GlobalSettings | null;
  error: Error | null;
  handleRefresh: () => void;
}) {
  if (error) {
    throw error;
  }

  if (!settings) {
    throw new Error('Settings data is unavailable.');
  }

  const { form, isFormLoading, handleSave } = useConfigForm(settings, handleRefresh);

  console.log('🎨 Rendering ConfigFormContainer');

  return (
    <Box pos='relative'>
      {/* LoadingOverlay shows during refresh transition */}
      <LoadingOverlay visible={isFormLoading} />

      <form onSubmit={handleSave}>
        <Stack gap='md'>
          <Title order={4}>2nd Floor</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
            <NumberInputWithCurrency
              label='Bed Rent'
              disabled={isFormLoading}
              key={form.key('bedRents.2nd.Bed')}
              {...form.getInputProps('bedRents.2nd.Bed')}
            />
            <NumberInputWithCurrency
              label='Room Rent'
              disabled={isFormLoading}
              key={form.key('bedRents.2nd.Room')}
              {...form.getInputProps('bedRents.2nd.Room')}
            />
            <NumberInputWithCurrency
              label='Special Rent'
              disabled={isFormLoading}
              key={form.key('bedRents.2nd.Special')}
              {...form.getInputProps('bedRents.2nd.Special')}
            />
          </SimpleGrid>

          <Divider mt='sm' />

          <Title order={4} mt='sm'>
            3rd Floor
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
            <NumberInputWithCurrency
              label='Bed Rent'
              disabled={isFormLoading}
              key={form.key('bedRents.3rd.Bed')}
              {...form.getInputProps('bedRents.3rd.Bed')}
            />
            <NumberInputWithCurrency
              label='Room Rent'
              disabled={isFormLoading}
              key={form.key('bedRents.3rd.Room')}
              {...form.getInputProps('bedRents.3rd.Room')}
            />
          </SimpleGrid>

          <Divider mt='sm' />

          <Title order={4} mt='sm'>
            General Settings
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
            <NumberInputWithCurrency
              label='Security Deposit'
              disabled={isFormLoading}
              key={form.key('securityDeposit')}
              {...form.getInputProps('securityDeposit')}
            />
            <NumberInputWithCurrency
              label='WiFi Monthly Charge'
              disabled={isFormLoading}
              key={form.key('wifiMonthlyCharge')}
              {...form.getInputProps('wifiMonthlyCharge')}
            />
            <TextInput
              label='UPI VPA'
              required
              rightSection={isFormLoading ? <Loader size={16} /> : undefined}
              disabled={isFormLoading}
              key={form.key('upiVpa')}
              {...form.getInputProps('upiVpa')}
              onBlur={(event) => {
                const trimmedValue = zStringTrimmed.safeParse(event.currentTarget.value).data || '';
                event.currentTarget.value = trimmedValue;
                form.setFieldValue('upiVpa', trimmedValue);
              }}
            />
          </SimpleGrid>

          <Group justify='flex-end' mt='md'>
            <Button variant='outline' type='button' onClick={handleRefresh} disabled={isFormLoading}>
              Refresh
            </Button>
            <Button
              variant='default'
              size='sm'
              radius='xl'
              type='button'
              onClick={form.reset}
              disabled={!form.isDirty() || isFormLoading}>
              Reset
            </Button>
            <Button type='submit' disabled={!form.isDirty() || isFormLoading || !form.isValid()}>
              {isFormLoading ? 'Saving...' : 'Save'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
