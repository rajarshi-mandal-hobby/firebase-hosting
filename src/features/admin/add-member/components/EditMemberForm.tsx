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
  Paper,
  List,
  VisuallyHidden,
  Fieldset,
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import type { Floor, BedType, GlobalSettings } from '../../../../data/shemas/GlobalSettings';

import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import { IconCalendarMonth, IconCall, IconEditOff, IconInfo } from '../../../../shared/icons';
import { formatMobileNumber, formatNumberIndianLocale, getSafeDate } from '../../../../shared/utils';
import { AddMemberConfirmationModal } from './AddMemberConfirmationModal';
import type { Member } from '../../../../shared/types/firestore-types';
import { useForm } from '@mantine/form';
import { startTransition, useState, useTransition } from 'react';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';

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
  isForwardOutstanding: boolean;
  outstandingAmount: number | string;
};

const stringToNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const calculateTotalDeposit = (
  rentAmount: number | string,
  securityDeposit: number | string,
  advanceDeposit: number | string
): number => {
  const nums = [rentAmount, securityDeposit, advanceDeposit];
  return nums.reduce((acc: number, curr) => {
    const num = stringToNumber(curr);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
};

export const EditMemberForm = ({ settings, member }: EditMemberFormProps) => {
  const currentSettingsRent = settings.bedRents[member.floor as Floor][member.bedType as BedType];
  if (!currentSettingsRent) {
    throw new Error('Invalid floor or bed type for member');
  }

  const hasMemberPaidDues =
    member.currentMonthRent.expenses.length > 0 && member.currentMonthRent.currentOutstanding <= 0;

  const [isSaving, saveTransition] = useTransition();
  const [outstandingAmount, setOutstandingAmount] = useState<number>(0);
  const [isConfirmModalOpen, confirmModalHandlers] = useDisclosure(false);
  const [isChangingBedType, setIsChangingBedType] = useState<boolean>(false);
  const [showCalculatedValues, setShowCalculatedValues] = useState({
    rentAmount: currentSettingsRent,
    securityDeposit: member.securityDeposit,
    advanceDeposit: member.advanceDeposit,
    total: calculateTotalDeposit(currentSettingsRent, member.securityDeposit, member.advanceDeposit),
  });

  const form = useForm<EditMemberFormData>({
    mode: 'uncontrolled',
    initialValues: {
      name: member.name,
      phone: member.phone.slice(-10),
      floor: member.floor as Floor,
      bedType: member.bedType as BedType,
      rentAmount: currentSettingsRent,
      rentAtJoining: member.rentAtJoining,
      securityDeposit: member.securityDeposit,
      advanceDeposit: member.advanceDeposit,
      optedForWifi: member.optedForWifi,
      moveInDate: getSafeDate(member.moveInDate),
      notes: '',
      amountPaid: '',
      isForwardOutstanding: true,
      outstandingAmount: 0,
    },
    onValuesChange(values, previous) {
      if (values.amountPaid !== previous.amountPaid) {
        const outStanding = values.amountPaid ? member.totalAgreedDeposit - stringToNumber(values.amountPaid) : 0;
        form.setFieldValue('isForwardOutstanding', outStanding > 0);
        setOutstandingAmount(outStanding);
        form.setFieldValue('outstandingAmount', outStanding);
        return;
      }

      startTransition(() => {
        setShowCalculatedValues({
          rentAmount: stringToNumber(values.rentAmount),
          securityDeposit: stringToNumber(values.securityDeposit),
          advanceDeposit: stringToNumber(values.advanceDeposit),
          total: calculateTotalDeposit(values.rentAmount, values.securityDeposit, values.advanceDeposit),
        });
      });

      const hasFloorChanged = values.floor !== previous.floor;
      const floor = values.floor || previous.floor;

      // Priority 1: Clear bedType and rentAmount when floor changes
      if (hasFloorChanged) {
        form.setFieldValue('bedType', null);
        form.setFieldValue('rentAmount', '');

      }

      // Priority 3: Clear rentAmount if floor or bedType is empty
      if (floor === null || values.bedType === null) {
        form.setFieldValue('rentAmount', '');
      }

      const hasBedTypeChanged = values.bedType !== previous.bedType;
      if (hasBedTypeChanged) {
        // Priority 4: Update rent amount based on valid combinations
        const floorRents = settings.bedRents[floor as Floor];
        if (values.bedType === 'Bed') {
          setRentAndDepositsFeldValues(floorRents.Bed);
        } else if (values.bedType === 'Room') {
          setRentAndDepositsFeldValues(floorRents.Room);
        } else if (floor === '2nd' && values.bedType === 'Special') {
          setRentAndDepositsFeldValues(settings.bedRents['2nd'].Special);
        }
      }
    },
  });

  function setRentAndDepositsFeldValues(value: number) {
    form.setFieldValue('rentAmount', value);
    form.setFieldValue('advanceDeposit', value);
  }

  const isRentMismatch = member.currentRent !== currentSettingsRent;
  const isSecurityDepositMismatch = member.securityDeposit !== settings.securityDeposit;
  const showMismatchAlert = isRentMismatch || isSecurityDepositMismatch;

  const actions = {
    onSave: () => {},
    onFullAmountChange: (c: boolean) => {},
    onCloseConfirm: () => {},
    onConfirm: () => {},
  };

  const handleFormReset = () => {
    form.reset();
    setOutstandingAmount(0);
  };

  console.log('🎨 Rendering EditMemberForm', outstandingAmount);

  return (
    <Box pos='relative'>
      <LoadingOverlay
        visible={isSaving}
        zIndex={100}
        overlayProps={{
          blur: 3,
        }}
      />

      {showMismatchAlert && (
        <Alert title='Rent Mismatch Detected' color='orange' mb='md'>
          <List size='sm' spacing='xs'>
            {isRentMismatch && (
              <List.Item fw={500}>
                Settings: {formatNumberIndianLocale(currentSettingsRent)} &mdash; Member:{' '}
                {formatNumberIndianLocale(member.currentRent)}
              </List.Item>
            )}
            {isSecurityDepositMismatch && (
              <List.Item fw={500}>
                Settings: {formatNumberIndianLocale(settings.securityDeposit)} &mdash; Member:{' '}
                {formatNumberIndianLocale(member.securityDeposit)}
              </List.Item>
            )}
          </List>
        </Alert>
      )}

      <form onSubmit={form.onSubmit(actions.onSave)}>
        <Stack>
          {/* Personal Information */}
          <Title order={5}>Personal Information</Title>
          <TextInput
            label='Full Name'
            placeholder={member.name}
            autoCapitalize='words'
            required
            key={form.key('name')}
            {...form.getInputProps('name')}
          />

          <Group grow preventGrowOverflow={false} wrap='nowrap'>
            <MonthPickerInput
              valueFormat='MMM YYYY'
              label='Join Month'
              placeholder='Pick date'
              description={dayjs(getSafeDate(member.moveInDate)).format('MMM YYYY')}
              required
              leftSection={<IconCalendarMonth size={16} />}
              w={150}
              key={form.key('moveInDate')}
              {...form.getInputProps('moveInDate')}
            />
            <NumberInput
              label='Phone Number'
              type='tel'
              placeholder='10-digit number'
              inputMode='tel'
              description={formatMobileNumber(member.phone)}
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
          </Group>

          {/* Additional Details */}
          <Fieldset legend='WiFi Details' mt='xl'>
            <Switch
              label='WiFi Opt-in'
              description='Toggle if the member is opting for WiFi'
              key={form.key('optedForWifi')}
              {...form.getInputProps('optedForWifi', { type: 'checkbox' })}
            />
          </Fieldset>

          {/* Accommodation Details */}
          {/* <Fieldset legend='Accommodation Details'> */}
          <Title order={5} mt='xl'>
            Accommodation Details
          </Title>
          <Group grow preventGrowOverflow={false} wrap='nowrap' mt={0}>
            <Select
              label='Floor'
              description={member.floor}
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
              description={member.bedType}
              data={[
                { value: 'Bed', label: 'Bed' },
                { value: 'Room', label: 'Room' },
                { value: 'Special', label: 'Special', disabled: form.values.floor !== '2nd' },
              ]}
              required
              key={form.key('bedType')}
              {...form.getInputProps('bedType')}
            />
          </Group>

          <Title order={5} mt='xl'>
            Payment Details
          </Title>

          <SimpleGrid cols={2}>
            <NumberInputWithCurrency
              label='Monthly Rent'
              placeholder='Enter rent amount'
              description={formatNumberIndianLocale(member.currentRent)}
              required
              readOnly
              rightSection={<IconEditOff size={16} />}
              key={form.key('rentAmount')}
              {...form.getInputProps('rentAmount')}
            />
            <NumberInputWithCurrency
              label='Security Deposit'
              placeholder='Enter security deposit'
              description={formatNumberIndianLocale(member.securityDeposit)}
              required
              key={form.key('securityDeposit')}
              {...form.getInputProps('securityDeposit')}
            />
            <NumberInputWithCurrency
              label='Advance Deposit'
              placeholder='Enter advance deposit'
              description={formatNumberIndianLocale(member.advanceDeposit)}
              required
              key={form.key('advanceDeposit')}
              {...form.getInputProps('advanceDeposit')}
            />
            <NumberInputWithCurrency
              label='Rent at Joining'
              placeholder='Enter current rent'
              description={formatNumberIndianLocale(member.rentAtJoining)}
              required
              key={form.key('rentAtJoining')}
              {...form.getInputProps('rentAtJoining')}
            />
          </SimpleGrid>

          {/* Payment Summary */}
          <Title order={5} mt='xl'>
            Payment Summary
          </Title>
          <SimpleGrid cols={2} spacing='xs' verticalSpacing='xs'>
            <Text size='sm'>Monthly Rent:</Text>
            <Text size='sm' fw={500}>
              {formatNumberIndianLocale(showCalculatedValues.rentAmount)}
            </Text>
            <Text size='sm'>Security Deposit:</Text>
            <Text size='sm' fw={500}>
              {formatNumberIndianLocale(showCalculatedValues.securityDeposit)}
            </Text>
            <Text size='sm'>Advance Deposit:</Text>
            <Text size='sm' fw={500}>
              {formatNumberIndianLocale(showCalculatedValues.advanceDeposit)}
            </Text>
            <Text size='sm' fw={700}>
              Total:
            </Text>
            <Text size='sm' fw={700}>
              {formatNumberIndianLocale(showCalculatedValues.total)}
            </Text>
          </SimpleGrid>

          <Alert color='indigo' mt='md' mb='md' icon={<IconInfo size={18} />}>
            Previously Agreed Deposit: <strong>{formatNumberIndianLocale(member.totalAgreedDeposit)}</strong>
          </Alert>
          <SimpleGrid cols={2}>
            <NumberInputWithCurrency
              label='Amount Paying Now'
              placeholder={formatNumberIndianLocale(showCalculatedValues.total)}
              readOnly={isChangingBedType}
              rightSection={isChangingBedType ? <IconEditOff size={16} /> : null}
              required
              key={form.key('amountPaid')}
              {...form.getInputProps('amountPaid')}
            />
          </SimpleGrid>
          <Checkbox
            label={`Forward outstanding amount of ${formatNumberIndianLocale(outstandingAmount)}?`}
            description="This amount will be added to current month's expenses"
            disabled={outstandingAmount === 0}
            key={form.key('isForwardOutstanding')}
            {...form.getInputProps('isForwardOutstanding', { type: 'checkbox' })}
          />
          <VisuallyHidden>
            <NumberInput
              hidden
              readOnly
              aria-hidden
              key={form.key('outstandingAmount')}
              {...form.getInputProps('outstandingAmount')}
            />
          </VisuallyHidden>
          <Textarea
            label='Notes (Optional)'
            placeholder='Any additional notes or remarks'
            key={form.key('notes')}
            {...form.getInputProps('notes')}
          />

          {/* Actions */}
          <Group justify='flex-end' mt='xl'>
            <Button variant='default' onClick={handleFormReset} disabled={!form.isDirty() || isSaving}>
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
