import {
  Alert,
  Box,
  Button,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Textarea,
  TextInput,
  Text,
  Title,
  Checkbox,
  VisuallyHidden,
  Fieldset,
  List,
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import type { Floor, BedType, GlobalSettings } from '../../../../data/shemas/GlobalSettings';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import {
  IconBed,
  IconCalendarMonth,
  IconCall,
  IconClose,
  IconEditOff,
  IconMoneyBag,
  IconNote,
  IconPayments,
  IconUndo,
  IconUniversalCurrency,
} from '../../../../shared/icons';
import { formatNumberIndianLocale, formatPhoneNumber, getSafeDate } from '../../../../shared/utils';
import { MyLoadingOverlay } from '../../../../shared/components/MyLoadingOverlay';
import MemberFormConfirmationModal from './MemberFormConfirmationModal';
import { useMemberDetailsForm } from '../hooks/useMemberDetailsForm';
import { notifyError } from '../../../../utils/notifications';
import type { MemberFormProps } from '../../pages/MemberFormPage';

export type MemberDetailsFormProps = {
  settings: GlobalSettings;
} & MemberFormProps;

export type MemberDetailsFormData = {
  name: string;
  phone: string | number;
  floor: Floor | null;
  bedType: BedType | null;
  rentAmount: number | string;
  rentAtJoining?: number | string;
  securityDeposit: number | string;
  advanceDeposit: number | string;
  isOptedForWifi: boolean;
  moveInDate: string;
  note: string;
  amountPaid: number | string;
  shouldForwardOutstanding: boolean;
  outstandingAmount: number | string;
};

const ICON_SIZE = 16;

export default function MemberDetailsForm({ settings, member, action }: MemberDetailsFormProps) {
  const currentSettingsRent = member ? settings.bedRents[member.floor as Floor][member.bedType as BedType] : 0;
  if (currentSettingsRent === undefined) {
    throw new Error(`Invalid bed type ${member?.bedType} for floor ${member?.floor}`);
  }

  const {
    form,
    formValues,
    isSaving,
    isConfirmModalOpen,
    shouldDisplayMismatchAlert,
    isRentMismatch,
    isSecurityDepositMismatch,
    isButtonDisabled,
    summary,
    actions,
  } = useMemberDetailsForm({ settings, member, currentSettingsRent, action });

  console.log('Rendering MemberDetailsForm');

  return (
    <Box pos='relative'>
      <MyLoadingOverlay visible={isSaving} />

      {member && shouldDisplayMismatchAlert && (
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

      <form
        onSubmit={form.onSubmit(actions.onSave, () =>
          notifyError('Please fix the validation errors before submitting the form.')
        )}>
        <Stack>
          {/* Personal Information */}
          <Title order={5}>Personal Information</Title>
          <TextInput
            label='Full Name'
            pattern='[A-Za-z\s]+'
            placeholder={member ? member.name : 'John Doe'}
            rightSection={form.isDirty('name') ? member ? <IconUndo size={ICON_SIZE} /> : <IconClose size={ICON_SIZE} /> : null}
            rightSectionProps={{
              onClick: () => (member ? form.setFieldValue('name', member.name) : form.setFieldValue('name', '')),
              style: { cursor: 'pointer' },
            }}
            rightSectionWidth={34}
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
              rightSection={
                member &&
                form.isDirty('moveInDate') && (
                  <IconUndo
                    size={ICON_SIZE}
                    onClick={() => form.setFieldValue('moveInDate', getSafeDate(member.moveInDate))}
                    style={{ cursor: 'pointer' }}
                  />
                )
              }
              required
              clearable={member || !form.isDirty('moveInDate') ? false : true}
              leftSection={<IconCalendarMonth size={ICON_SIZE} />}
              disabled={action === 'reactivate'}
              flex={1}
              miw={160}
              key={form.key('moveInDate')}
              {...form.getInputProps('moveInDate')}
            />
            <TextInput
              label='Phone Number'
              type='tel'
              placeholder='10-digit number'
              inputMode='numeric'
              rightSection={form.isDirty('phone') ? member ? <IconUndo size={ICON_SIZE} /> : <IconClose size={ICON_SIZE} /> : null}
              rightSectionProps={{
                onClick: () =>
                  member
                    ? form.setFieldValue('phone', formatPhoneNumber(member.phone))
                    : form.setFieldValue('phone', ''),
                style: { cursor: 'pointer' },
              }}
              rightSectionWidth={34}
              leftSection={<IconCall size={ICON_SIZE} />}
              required
              flex={2}
              key={form.key('phone')}
              {...form.getInputProps('phone')}
            />
          </Group>

          {/* Additional Details */}
          <Fieldset legend='WiFi Details' mt='xl'>
            <Switch
              label='WiFi Opt-in'
              size='sm'
              description={
                member
                  ? member.optedForWifi
                    ? 'Member has opted for WiFi'
                    : 'Member has not opted for WiFi'
                  : 'Toggle if the member is opting for WiFi'
              }
              key={form.key('isOptedForWifi')}
              {...form.getInputProps('isOptedForWifi', { type: 'checkbox' })}
            />
          </Fieldset>

          {/* Accommodation Details */}
          <Title order={5} mt='xl'>
            Accommodation Details
          </Title>
          <Group grow preventGrowOverflow={false} wrap='nowrap' mt={0}>
            <Select
              label='Floor'
              placeholder='Select floor'
              leftSection={
                member && form.isDirty('floor') ? (
                  <IconUndo
                    size={ICON_SIZE}
                    onClick={() => {
                      form.setFieldValue('floor', member.floor);
                      form.setFieldValue('bedType', member.bedType);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                ) : (
                  <IconBed size={ICON_SIZE} />
                )
              }
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
              leftSection={
                member && form.isDirty('bedType') ? (
                  <IconUndo
                    size={ICON_SIZE}
                    onClick={() => {
                      form.setFieldValue('floor', member.floor);
                      form.setFieldValue('bedType', member.bedType);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                ) : (
                  <IconBed size={ICON_SIZE} />
                )
              }
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

          <SimpleGrid cols={2} verticalSpacing='sm'>
            <NumberInputWithCurrency
              label='Monthly Rent'
              placeholder='Select bed type'
              required
              readOnly
              rightSection={<IconEditOff size={ICON_SIZE} />}
              rightSectionWidth={34}
              key={form.key('rentAmount')}
              {...form.getInputProps('rentAmount')}
            />
            <NumberInputWithCurrency
              label='Advance Deposit'
              placeholder={form.values.rentAmount.toString() || 'Enter advance deposit'}
              rightSection={<IconEditOff size={ICON_SIZE} />}
              rightSectionWidth={34}
              readOnly
              required
              key={form.key('advanceDeposit')}
              {...form.getInputProps('advanceDeposit')}
            />
            <NumberInputWithCurrency
              label='Security Deposit'
              placeholder={settings.securityDeposit.toString()}
              rightSection={
                form.isDirty('securityDeposit') ? member ? <IconUndo size={ICON_SIZE} /> : <IconClose size={ICON_SIZE} /> : null
              }
              rightSectionProps={{
                onClick: () =>
                  member
                    ? form.setFieldValue('securityDeposit', member.securityDeposit)
                    : form.setFieldValue('securityDeposit', settings.securityDeposit),
                style: { cursor: 'pointer' },
              }}
              rightSectionWidth={34}
              required
              key={form.key('securityDeposit')}
              {...form.getInputProps('securityDeposit')}
            />

            {!!member && (
              <NumberInputWithCurrency
                label='Rent at Joining'
                placeholder='Enter current rent'
                rightSection={form.isDirty('rentAtJoining') ? <IconUndo size={ICON_SIZE} /> : null}
                rightSectionProps={{
                  onClick: () => form.setFieldValue('rentAtJoining', member.rentAtJoining),
                  style: { cursor: 'pointer' },
                }}
                rightSectionWidth={34}
                required
                key={form.key('rentAtJoining')}
                {...form.getInputProps('rentAtJoining')}
              />
            )}
          </SimpleGrid>

          {/* Payment Summary */}
          <Title order={5} mt='xl'>
            Payment Summary
          </Title>
          <SimpleGrid cols={2} spacing='xs' verticalSpacing='xs'>
            <Group gap='xs'>
              <IconUniversalCurrency />
              <Text>Monthly Rent:</Text>
            </Group>
            <Text fw={500}>{formatNumberIndianLocale(summary.rentAmount)}</Text>
            <Group gap='xs'>
              <IconUniversalCurrency />
              <Text>Advance Deposit:</Text>
            </Group>
            <Text fw={500}>{formatNumberIndianLocale(summary.advanceDeposit)}</Text>
            <Group gap='xs'>
              <IconUniversalCurrency />
              <Text>Security Deposit:</Text>
            </Group>
            <Text fw={500}>{formatNumberIndianLocale(summary.securityDeposit)}</Text>
            <Group gap='xs'>
              <IconPayments />
              <Text fw={700}>Total:</Text>
            </Group>
            <Text fw={700}>{formatNumberIndianLocale(summary.total)}</Text>
          </SimpleGrid>

          {!!member && (
            <Alert color='indigo' mt='md' icon={<IconMoneyBag />}>
              Previously Agreed Deposit: <strong>{formatNumberIndianLocale(member.totalAgreedDeposit)}</strong>
            </Alert>
          )}
          <SimpleGrid cols={2} mt='md'>
            <NumberInputWithCurrency
              label='Amount Paying Now'
              placeholder={summary.total.toString()}
              required
              readOnly={!!member && action === 'edit'}
              rightSection={member ? <IconEditOff size={ICON_SIZE} /> : form.isDirty('amountPaid') && <IconClose size={ICON_SIZE} />}
              rightSectionProps={{
                onClick: () => !member && form.setFieldValue('amountPaid', ''),
                style: { cursor: !member ? 'pointer' : 'default' },
              }}
              rightSectionWidth={34}
              key={form.key('amountPaid')}
              {...form.getInputProps('amountPaid')}
            />
          </SimpleGrid>
          <Checkbox
            label={`Forward outstanding amount of ${formatNumberIndianLocale(summary.outstanding)}?`}
            description="This amount will be added to current month's expenses"
            disabled={summary.outstanding === 0}
            key={form.key('shouldForwardOutstanding')}
            {...form.getInputProps('shouldForwardOutstanding', { type: 'checkbox' })}
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
            label={<Group gap='xs'><IconNote size={ICON_SIZE} /> <Text>Notes (Optional)</Text></Group>}
            placeholder='Any additional notes or remarks'
            rightSection={form.isDirty('note') ? member ? <IconUndo size={ICON_SIZE} /> : <IconClose size={ICON_SIZE} /> : null}
            rightSectionProps={{
              onClick: () => (member ? form.setFieldValue('note', member.note) : form.setFieldValue('note', '')),
              style: { cursor: 'pointer' },
            }}
            maxRows={3}
            resize='block'
            mt='md'
            key={form.key('note')}
            {...form.getInputProps('note')}
          />

          {/* Actions */}
          <Group justify='flex-end' mt='xl'>
            <Button variant='default' onClick={actions.onHandleReset} disabled={!form.isDirty()}>
              Reset
            </Button>
            <Button type='submit' disabled={isButtonDisabled}>
              {member ? 'Update Member' : 'Add Member'}
            </Button>
          </Group>
        </Stack>
      </form>

      <MemberFormConfirmationModal
        opened={isConfirmModalOpen}
        actions={{ onClose: actions.onCloseConfirm, onConfirm: actions.onConfirm }}
        note={actions.generateNote()}
        formValues={formValues}
        dirtyFields={member ? form.getDirty() : undefined}
      />
    </Box>
  );
}
