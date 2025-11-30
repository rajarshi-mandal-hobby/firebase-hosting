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
  Checkbox,
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import type { Floor, BedType, GlobalSettings } from '../../../../data/shemas/GlobalSettings';

import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import { IconCalendarMonth, IconCall } from '../../../../shared/icons';
import { formatMobileNumber, formatNumberIndianLocale, getSafeDate } from '../../../../shared/utils';
import { AddMemberConfirmationModal } from './AddMemberConfirmationModal';
import type { Member } from '../../../../shared/types/firestore-types';
import { useForm } from '@mantine/form';
import { useState, useTransition } from 'react';
import { useDisclosure } from '@mantine/hooks';

interface EditMemberFormProps {
  settings: GlobalSettings;
  member: Member;
}

export type EditMemberFormData = {
  name: string;
  phone: string | number;
  floor: Floor | null;
  bedType: BedType | null;
  rentAmount: number | string;
  rentAtJoining?: number | string;
  securityDeposit: number | string;
  advanceDeposit: number | string;
  optedForWifi: boolean;
  moveInDate: string;
  notes: string;
  amountPaid: number | string;
};

export const EditMemberForm = ({ settings, member }: EditMemberFormProps) => {
  const currentRent = settings.bedRents[member.floor as Floor][member.bedType as BedType] ?? '';
  if (member && !currentRent) {
    throw new Error(`No rent found for floor ${member.floor} and bed type ${member.bedType}`);
  }

  const [isSaving, saveTransition] = useTransition();
  const [outstandingAmount, setOutstandingAmount] = useState<number>(0);
  const [isFullAmountPaid, setIsFullAmountPaid] = useState<boolean>(false);
  const [isConfirmModalOpen, confirmModalHandlers] = useDisclosure(false);
  const form = useForm<EditMemberFormData>({
    mode: 'uncontrolled',
    initialValues: {
      name: member.name,
      phone: member.phone,
      floor: member.floor as Floor,
      bedType: member.bedType as BedType,
      rentAmount: currentRent,
      rentAtJoining: member.rentAtJoining,
      securityDeposit: member.securityDeposit,
      advanceDeposit: member.advanceDeposit,
      optedForWifi: member.optedForWifi,
      moveInDate: getSafeDate(member.moveInDate),
      notes: '',
      amountPaid: member.totalAgreedDeposit,
    },
    onValuesChange(values, previous) {
      const newTotalAmount =
        Number(values.rentAmount || 0) + Number(values.securityDeposit || 0) + Number(values.advanceDeposit || 0);
      if (values.amountPaid !== previous.amountPaid) {
        const outStanding = newTotalAmount - Number(values.amountPaid || 0);
        console.log('Outstanding amount recalculated', outStanding);
        setOutstandingAmount(outStanding);
        return;
      }

      const hasFloorChanged = values.floor !== previous.floor;
      const floor = values.floor || previous.floor;

      // Priority 1: Clear bedType and rentAmount when floor changes
      if (hasFloorChanged) {
        form.setFieldValue('bedType', null);
        form.setFieldValue('rentAmount', '');
        form.setFieldValue('advanceDeposit', '');
        return;
      }

      // Priority 3: Clear rentAmount if floor or bedType is empty
      if (floor === null || values.bedType === null) {
        form.setFieldValue('rentAmount', '');
        return;
      }

      const hasBedTypeChanged = values.bedType !== previous.bedType;
      if (hasBedTypeChanged) {
        // Priority 4: Update rent amount based on valid combinations
        const floorRents = settings.bedRents[floor as Floor];
        if (values.bedType === 'Bed') {
          form.setFieldValue('rentAmount', floorRents.Bed);
          form.setFieldValue('advanceDeposit', floorRents.Bed);
        } else if (values.bedType === 'Room') {
          form.setFieldValue('rentAmount', floorRents.Room);
          form.setFieldValue('advanceDeposit', floorRents.Room);
        } else if (floor === '2nd' && values.bedType === 'Special') {
          form.setFieldValue('rentAmount', settings.bedRents['2nd'].Special);
          form.setFieldValue('advanceDeposit', settings.bedRents['2nd'].Special);
        }
        return;
      }
    },
  });

  const calculatedTotalAmount =
    Number(form.values.rentAmount || 0) +
    Number(form.values.securityDeposit || 0) +
    Number(form.values.advanceDeposit || 0);

  const actions = {
    onSave: () => {},
    onFullAmountChange: (c: boolean) => {},
    onCloseConfirm: () => {},
    onConfirm: () => {},
  };

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
              description={member ? getSafeDate(member.moveInDate) : null}
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
              description={formatMobileNumber(member?.phone)}
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
              description={member?.floor}
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
              description={member?.bedType}
              data={[
                { value: 'Bed', label: 'Bed' },
                { value: 'Room', label: 'Room' },
                { value: 'Special', label: 'Special', disabled: form.values.floor !== '2nd' },
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
              description={member?.currentRent}
              required
              readOnly
              key={form.key('rentAmount')}
              //   value={rentAmount}
              {...form.getInputProps('rentAmount')}
            />
            <NumberInputWithCurrency
              label='Security Deposit'
              placeholder='Enter security deposit'
              description={member?.securityDeposit}
              required
              key={form.key('securityDeposit')}
              {...form.getInputProps('securityDeposit')}
            />
            <NumberInputWithCurrency
              label='Advance Deposit'
              placeholder='Enter advance deposit'
              description={member?.advanceDeposit}
              required
              key={form.key('advanceDeposit')}
              //   value={rentAmount}
              {...form.getInputProps('advanceDeposit')}
            />
            {member?.rentAtJoining && (
              <NumberInputWithCurrency
                label='Rent at Joining'
                placeholder='Enter current rent'
                description='Fixed at joining'
                required
                key={form.key('rentAtJoining')}
                {...form.getInputProps('rentAtJoining')}
              />
            )}
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
                description={member?.totalAgreedDeposit}
                disabled={isFullAmountPaid}
                required
                key={form.key('amountPaid')}
                {...form.getInputProps('amountPaid')}
              />
            </Group>
            <Checkbox
              label={`Forward outstanding amount of ${formatNumberIndianLocale(outstandingAmount)} to next month?`}
              onChange={() => {}}
            />
            {/* Outstanding amount that will be forwarded to next month:{' '}
            <strong>{formatNumberIndianLocale(outstandingAmount)}</strong> */}
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
              {member ? 'Update Member' : 'Add Member'}
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
