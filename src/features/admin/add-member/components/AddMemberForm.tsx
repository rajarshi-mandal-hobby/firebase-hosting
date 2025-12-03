import {
  Alert,
  Box,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  NumberInput,
  rem,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Textarea,
  TextInput,
  Text,
  Title,
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import type { GlobalSettings } from '../../../../data/shemas/GlobalSettings';

import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import { IconCalendarMonth, IconCall } from '../../../../shared/icons';
import { formatNumberIndianLocale } from '../../../../shared/utils';
import { AddMemberConfirmationModal } from './AddMemberConfirmationModal';
import { useAddMemberForm } from '../hooks/useAddMemberForm';
import type { Member } from '../../../../shared/types/firestore-types';

type AddMemberFormProps = {
  settings: GlobalSettings;
  member?: Member;
};

export const AddMemberForm = ({ settings, member }: AddMemberFormProps) => {
  const { isSaving, form, outstandingAmount, calculatedTotalAmount, isFullAmountPaid, actions, isConfirmModalOpen } =
    useAddMemberForm({
      settings,
      member,
    });

  console.log('🎨 Rendering AddMemberForm', form.errors, form.isValid());

  return (
    <Box pos='relative'>
      <LoadingOverlay
        visible={isSaving}
        zIndex={100}
        overlayProps={{
          blur: 3,
        }}
      />

      <form onSubmit={form.onSubmit(actions.onSave, (errors) => console.log('Validation errors:', errors))}>
        <Stack gap='lg'>
          {/* Personal Information */}
          <Title order={5}>Personal Information</Title>
          <TextInput
            label='Full Name'
            placeholder='Enter member name'
            autoCapitalize='words'
            required
            key={form.key('name')}
            {...form.getInputProps('name')}
          />

          <SimpleGrid cols={2} spacing='lg'>
            <MonthPickerInput
              valueFormat='MMM YYYY'
              label='Join Month'
              placeholder='Pick date'
              required
              leftSection={<IconCalendarMonth size={16} />}
              key={form.key('moveInDate')}
              {...form.getInputProps('moveInDate')}
            />
            <NumberInput
              label='Phone Number'
              type='tel'
              placeholder='Enter 10-digit phone number'
              inputMode='tel'
              hideControls
              allowNegative={false}
              decimalScale={0}
              maxLength={15}
              minLength={10}
              leftSection={<IconCall size={16} />}
              required
              styles={{
                section: { fontSize: rem(14) },
              }}
              key={form.key('phone')}
              {...form.getInputProps('phone')}
            />
          </SimpleGrid>

          <Divider mb='md' />

          {/* Accommodation Details */}
          <Title order={5}>Accommodation Details</Title>
          <SimpleGrid cols={2} spacing='lg'>
            <Select
              label='Floor'
              placeholder='Select floor'
              data={[
                { value: '2nd', label: '2nd Floor' },
                { value: '3rd', label: '3rd Floor' },
              ]}
              required
              key={form.key('floor')}
              {...form.getInputProps('floor')}
            />
            <Select
              label='Bed Type'
              placeholder='Select bed type'
              disabled={!form.values.floor}
              data={[
                { value: 'Bed', label: 'Bed' },
                { value: 'Room', label: 'Room' },
                { value: 'Special', label: 'Special' },
              ]}
              required
              key={form.key('bedType')}
              {...form.getInputProps('bedType')}
            />
          </SimpleGrid>

          <Divider mb='md' />

          {/* Financial Details */}
          <Title order={5}>Financial Details</Title>
          <SimpleGrid cols={2} spacing='lg'>
            <NumberInputWithCurrency
              label='Monthly Rent'
              placeholder='Enter rent amount'
              required
              readOnly
              key={form.key('rentAmount')}
              //   value={rentAmount}
              {...form.getInputProps('rentAmount')}
            />
            <NumberInputWithCurrency
              label='Security Deposit'
              placeholder='Enter security deposit'
              required
              key={form.key('securityDeposit')}
              {...form.getInputProps('securityDeposit')}
            />
            <NumberInputWithCurrency
              label='Advance Deposit'
              placeholder='Enter advance deposit'
              required
              key={form.key('advanceDeposit')}
              //   value={rentAmount}
              {...form.getInputProps('advanceDeposit')}
            />
          </SimpleGrid>

          <Divider mb='md' />

          {/* Additional Details */}
          <Title order={5}>Wifi Details</Title>

          <Switch
            label='WiFi Opt-in'
            description='Toggle if the member is opting for WiFi'
            key={form.key('optedForWifi')}
            {...form.getInputProps('optedForWifi', { type: 'checkbox' })}
            mb='md'
          />

          <Alert variant='default' title='Summary' mb='md'>
            <SimpleGrid cols={2} spacing='xs' mb='md'>
              <Text size='sm'>Monthly Rent:</Text>
              <Text size='sm' fw={500}>
                {formatNumberIndianLocale(Number(form.values.rentAmount))}
              </Text>
              <Text size='sm'>Security Deposit:</Text>
              <Text size='sm' fw={500}>
                {formatNumberIndianLocale(Number(form.values.securityDeposit))}
              </Text>
              <Text size='sm'>Advance Deposit:</Text>
              <Text size='sm' fw={500}>
                {formatNumberIndianLocale(Number(form.values.advanceDeposit))}
              </Text>
            </SimpleGrid>
            <Divider />
            <SimpleGrid cols={2} spacing='xs' mb='xs' mt='xs'>
              <Text size='sm' fw={700}>
                Total:
              </Text>
              <Text size='sm' fw={700}>
                {formatNumberIndianLocale(calculatedTotalAmount)}
              </Text>
            </SimpleGrid>
            <Divider mb={1} />
            <Divider mb='md' />
            Is member paying the full agreed deposit and rent amount?
            {/* Is member paying the full agreed deposit and rent amount? */}
            <Group grow mt='lg' mb='lg' align='flex-start' justify='center'>
              <Switch
                label={isFullAmountPaid ? 'Yes' : 'No'}
                description={isFullAmountPaid ? 'Paying the full amount' : 'Paying a partial amount'}
                checked={isFullAmountPaid}
                disabled={!form.values.bedType || !form.values.floor}
                mt={2}
                type='checkbox'
                onChange={(event) => {
                  const c = event.currentTarget.checked;
                  form.setFieldValue('amountPaid', c ? calculatedTotalAmount : '');
                  actions.onFullAmountChange(c);
                }}
              />
              <NumberInputWithCurrency
                label='Paying Amount'
                placeholder='Total Amount'
                disabled={isFullAmountPaid}
                required
                key={form.key('amountPaid')}
                {...form.getInputProps('amountPaid')}
              />
            </Group>
            Outstanding amount that will be forwarded to next month:{' '}
            <strong>{formatNumberIndianLocale(outstandingAmount)}</strong>
          </Alert>

          <Textarea
            label='Notes (Optional)'
            placeholder='Any additional notes or remarks'
            key={form.key('notes')}
            {...form.getInputProps('notes')}
          />

          {/* Actions */}
          <Group justify='flex-end' mt='xl'>
            <Button variant='default' onClick={form.reset} disabled={!form.isDirty() || isSaving}>
              Reset
            </Button>
            <Button type='submit' disabled={!form.isDirty() || isSaving}>
              Add Member
            </Button>
          </Group>
        </Stack>
      </form>

      <AddMemberConfirmationModal
        opened={isConfirmModalOpen}
        actions={{ onClose: actions.onCloseConfirm, onConfirm: actions.onConfirm }}
        formValues={form.getTransformedValues()}
        outstandingAmount={outstandingAmount}
      />
    </Box>
  );
};
