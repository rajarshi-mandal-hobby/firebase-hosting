import { Button, Divider, Group, Loader, SimpleGrid, Stack, TextInput, Title } from '@mantine/core';
import { memo, useRef } from 'react';
import { useConfig } from '../hooks/useConfig';
import { useForm } from '@mantine/form';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import { RetryBox } from '../../../../shared/components/RetryBox';
import type { SaveResult } from '../../../../data/shemas/formResults';
import { formValidator, zInteger, zStringTrimmed } from '../../../../utils/validators';
import { type GlobalSettings, type GlobalSettingsFormValues } from '../../../../data/shemas/GlobalSettings';
import { notify } from '../../../../utils/notificaions';

const sanitizeValues = (values: GlobalSettingsFormValues): GlobalSettingsFormValues => ({
  bedRents: {
    '2nd': {
      Bed: zInteger.parse(values.bedRents['2nd'].Bed),
      Room: zInteger.parse(values.bedRents['2nd'].Room),
      Special: zInteger.parse(values.bedRents['2nd'].Special),
    },
    '3rd': {
      Bed: zInteger.parse(values.bedRents['3rd'].Bed),
      Room: zInteger.parse(values.bedRents['3rd'].Room),
    },
  },
  securityDeposit: zInteger.parse(values.securityDeposit),
  wifiMonthlyCharge: zInteger.parse(values.wifiMonthlyCharge),
  upiVpa: zStringTrimmed.parse(values.upiVpa),
});

const ConfigManagement = memo(() => {
  const { loading, error, globalSettings, handleRefresh, handleSaveSettings } = useConfig();

  console.log('🎨 Rendering ConfigManagement');

  if (error) {
    return <RetryBox error={error || 'Failed to load the settings'} handleRetry={handleRefresh} loading={loading} />;
  }

  return (
    <ConfigForm
      globalSettings={globalSettings}
      loading={loading}
      onSave={handleSaveSettings}
      key={globalSettings ? 'loaded' : 'no-settings'}
    />
  );
});

const ConfigForm = ({
  globalSettings,
  loading,
  onSave,
}: {
  globalSettings: GlobalSettings | null;
  loading: boolean;
  onSave: (values: GlobalSettingsFormValues) => Promise<SaveResult>;
}) => {
  const hasValueChanged = useRef(false);

  const form = useForm<GlobalSettingsFormValues>({
    mode: 'uncontrolled',
    onSubmitPreventDefault: 'always',
    initialValues: globalSettings
      ? {
          securityDeposit: globalSettings.securityDeposit,
          wifiMonthlyCharge: globalSettings.wifiMonthlyCharge,
          upiVpa: globalSettings.upiVpa,
          bedRents: {
            '2nd': {
              Bed: globalSettings.bedRents['2nd'].Bed,
              Room: globalSettings.bedRents['2nd'].Room,
              Special: globalSettings.bedRents['2nd'].Special,
            },
            '3rd': {
              Bed: globalSettings.bedRents['3rd'].Bed,
              Room: globalSettings.bedRents['3rd'].Room,
            },
          },
        }
      : undefined,
    validate: {
      securityDeposit: formValidator.fourDigit,
      wifiMonthlyCharge: formValidator.threeToFourDigit,
      upiVpa: formValidator.upiVpa,
      bedRents: {
        '2nd': {
          Bed: formValidator.fourDigit,
          Room: formValidator.fourDigit,
          Special: formValidator.fourDigit,
        },
        '3rd': {
          Bed: formValidator.fourDigit,
          Room: formValidator.fourDigit,
        },
      },
    },
    validateInputOnChange: true,
    transformValues: sanitizeValues,
    onValuesChange(current, previous) {
      hasValueChanged.current = JSON.stringify(sanitizeValues(current)) !== JSON.stringify(sanitizeValues(previous));
    },
  });

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.validate(); // Ensure all fields are validated
    const validationErrors = form.validate().hasErrors;
    if (loading || validationErrors) return;

    const formValues = form.getTransformedValues();

    onSave(formValues)
      .then((result) => {
        if (result.success) {
          form.resetDirty(formValues);
          notify.success('Global settings saved successfully');
        } else {
          if (result.errors.formErrors.length) {
            notify.error(result.errors.formErrors.join(', '));
          }
          form.setErrors(result.errors.fieldErrors);
        }
      })
      .catch((result) => {
        const err = result.errors.formErrors[0];
        notify.error(err || 'Failed to save the settings. Please try again.');
      });
  };

  console.log('Form rendered');
  return (
    <form onSubmit={handleSave} noValidate>
      <Stack gap='md'>
        <Title order={4}>2nd Floor</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
          <NumberInputWithCurrency
            label='Bed Rent'
            disabled={loading}
            key={form.key('bedRents.2nd.Bed')}
            {...form.getInputProps('bedRents.2nd.Bed')}
          />
          <NumberInputWithCurrency
            label='Room Rent'
            disabled={loading}
            key={form.key('bedRents.2nd.Room')}
            {...form.getInputProps('bedRents.2nd.Room')}
          />
          <NumberInputWithCurrency
            label='Special Rent'
            disabled={loading}
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
            disabled={loading}
            key={form.key('bedRents.3rd.Bed')}
            {...form.getInputProps('bedRents.3rd.Bed')}
          />
          <NumberInputWithCurrency
            label='Room Rent'
            disabled={loading}
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
            disabled={loading}
            key={form.key('securityDeposit')}
            {...form.getInputProps('securityDeposit')}
          />
          <NumberInputWithCurrency
            label='WiFi Monthly Charge'
            disabled={loading}
            key={form.key('wifiMonthlyCharge')}
            {...form.getInputProps('wifiMonthlyCharge')}
          />
          <TextInput
            label='UPI VPA'
            required
            rightSection={loading ? <Loader size={16} /> : undefined}
            disabled={loading}
            key={form.key('upiVpa')}
            {...form.getInputProps('upiVpa')}
            onBlur={(event) => {
              const trimmedValue = zStringTrimmed.safeParse(event.currentTarget.value).data || '';
              event.currentTarget.value = trimmedValue; // Update input value to trimmed version
              form.setFieldValue('upiVpa', trimmedValue);
            }}
          />
        </SimpleGrid>

        <Group justify='flex-end' mt='md'>
          <Button
            variant='default'
            size='sm'
            radius='xl'
            type='button'
            onClick={() => form.reset()}
            disabled={!form.isDirty() || loading}>
            Reset
          </Button>
          <Button
            size='sm'
            radius='xl'
            type='submit'
            disabled={!form.isDirty() || loading || !hasValueChanged.current || !form.isValid()}
            loading={loading}>
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default ConfigManagement;
