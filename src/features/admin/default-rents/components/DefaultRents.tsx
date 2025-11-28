import { Button, Divider, Group, LoadingOverlay, SimpleGrid, Stack, TextInput, Title, Box } from '@mantine/core';
import { Suspense, useState } from 'react';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency.tsx';
import { GlobalSettings } from '../../../../data/shemas/GlobalSettings.ts';
import { ErrorBoundary } from '../../../../shared/components/index.ts';
import { DefaultRentsSkeleton } from './DefaultRentsSkeleton.tsx';
import { ErrorContainer } from '../../../../shared/components/ErrorContainer.tsx';
import { useDefaultRents } from '../hooks/useDefaultRents.ts';
import { useDefaultRentsForm } from '../hooks/useDefaultRentsForm.ts';
import { LoadingBox } from '../../../../shared/components/LoadingBox.tsx';

const DefaultRents = () => {
  console.log('🎨 Rendering DefaultRents');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ErrorBoundary onRetry={() => setRefreshKey((prev) => prev + 1)} key={refreshKey}>
      <Suspense fallback={<LoadingBox loadingText='Loading Default Rents...' forComponent='Default Rents' />}>
        <DefaultRentsContainer />
      </Suspense>
    </ErrorBoundary>
  );
};

export default DefaultRents;

function DefaultRentsContainer() {
  const { settings, loading, error, actions } = useDefaultRents();

  console.log('🎨 Rendering DefaultRentsContainer', settings, loading, error);
  return (
    <>
      {loading && <DefaultRentsSkeleton />}
      {!!error && <ErrorContainer error={error} onRetry={actions.handleRefresh} />}
      {!loading && !error && settings && <DefaultRentsForm settings={settings} handleRefresh={actions.handleRefresh} />}
    </>
  );
}

function DefaultRentsForm({ settings, handleRefresh }: { settings: GlobalSettings; handleRefresh: () => void }) {
  const { form, isFormLoading, handleSave } = useDefaultRentsForm(settings, handleRefresh);

  console.log('🎨 Rendering DefaultRentsForm');

  return (
    <Box pos='relative'>
      {/* LoadingOverlay shows during refresh transition */}
      <LoadingOverlay visible={isFormLoading} />

      <form onSubmit={form.onSubmit(handleSave)}>
        <Stack gap='lg'>
          <Title order={4}>2nd Floor Rents</Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing='lg'>
            <NumberInputWithCurrency
              label='Bed Rent'
              description={form.errors['bedRents.2nd.Bed'] ? null : 'Minimum ₹1600'}
              required
              inputWrapperOrder={['label', 'description', 'error', 'input']}
              key={form.key('bedRents.2nd.Bed')}
              {...form.getInputProps('bedRents.2nd.Bed')}
            />
            <NumberInputWithCurrency
              label='Room Rent'
              description={form.errors['bedRents.2nd.Room'] ? null : 'Double the Bed Rent'}
              required
              inputWrapperOrder={['label', 'description', 'error', 'input']}
              key={form.key('bedRents.2nd.Room')}
              {...form.getInputProps('bedRents.2nd.Room')}
            />
            <NumberInputWithCurrency
              label='Special Rent'
              description={form.errors['bedRents.2nd.Special'] ? null : 'Greater than Bed Rent'}
              required
              inputWrapperOrder={['label', 'description', 'error', 'input']}
              key={form.key('bedRents.2nd.Special')}
              {...form.getInputProps('bedRents.2nd.Special')}
            />
          </SimpleGrid>

          <Divider mt='sm' />

          <Title order={4} mt='sm'>
            3rd Floor Rents
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing='lg'>
            <NumberInputWithCurrency
              label='Bed Rent'
              description={form.errors['bedRents.3rd.Bed'] ? null : 'Minimum ₹1600'}
              required
              inputWrapperOrder={['label', 'description', 'error', 'input']}
              key={form.key('bedRents.3rd.Bed')}
              {...form.getInputProps('bedRents.3rd.Bed')}
            />
            <NumberInputWithCurrency
              label='Room Rent'
              description={form.errors['bedRents.3rd.Room'] ? null : 'Double the Bed Rent'}
              required
              inputWrapperOrder={['label', 'description', 'error', 'input']}
              key={form.key('bedRents.3rd.Room')}
              {...form.getInputProps('bedRents.3rd.Room')}
            />
          </SimpleGrid>

          <Divider mt='sm' />

          <Title order={4} mt='sm'>
            General Charges
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing='lg'>
            <NumberInputWithCurrency
              label='Security Deposit'
              description={form.errors['securityDeposit'] ? null : 'Minimum ₹1000'}
              required
              inputWrapperOrder={['label', 'description', 'error', 'input']}
              key={form.key('securityDeposit')}
              {...form.getInputProps('securityDeposit')}
            />
            <NumberInputWithCurrency
              label='WiFi Monthly Charge'
              description={form.errors['wifiMonthlyCharge'] ? null : 'Minimum ₹100'}
              required
              inputWrapperOrder={['label', 'description', 'error', 'input']}
              key={form.key('wifiMonthlyCharge')}
              {...form.getInputProps('wifiMonthlyCharge')}
            />
            <TextInput
              label='UPI VPA'
              description={form.errors['upiVpa'] ? null : 'name@bank'}
              required
              key={form.key('upiVpa')}
              {...form.getInputProps('upiVpa')}
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
            <Button type='submit' disabled={!form.isDirty() || isFormLoading}>
              {isFormLoading ? 'Saving...' : 'Save'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
