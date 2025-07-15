import { useState, useEffect } from 'react';
import {
  Button,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Divider,
  Combobox,
  useCombobox,
  Pill,
  CheckIcon,
  PillsInput,
  Input,
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { SharedModal } from '../../../../shared/components/SharedModal';
import { notifications } from '@mantine/notifications';
import { FirestoreService } from '../../../../data/firestoreService';
import { useData } from '../../../../hooks';
import type { GlobalSettings, Member } from '../../../../shared/types/firestore-types';

interface GenerateBillsModalProps {
  opened: boolean;
  onClose: () => void;
}

export function GenerateBillsModal({ opened, onClose }: GenerateBillsModalProps) {
  const [loading, setLoading] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [activeMembers, setActiveMembers] = useState<{ value: string; label: string }[]>([]);
  const { getGlobalSettings, getMembers } = useData();

  const [formData, setFormData] = useState({
    billingMonth: new Date(),
    secondFloorElectricity: 0,
    thirdFloorElectricity: 0,
    memberCountEditable: false,
    secondFloorCount: 0, // Will be set from globalSettings
    thirdFloorCount: 0, // Will be set from globalSettings
    // Multi-select expense entry
    expenseMemberIds: [] as string[],
    expenseAmount: 0,
    expenseDescription: '',
    // Multi-select wifi charge entry
    wifiMemberIds: [] as string[],
    wifiAmount: 0, // Will be set from globalSettings
  });

  // Load data when modal opens
  useEffect(() => {
    if (opened) {
      Promise.all([
        getGlobalSettings(),
        getMembers({ isActive: true })
      ]).then(([settings, members]) => {
        setGlobalSettings(settings);
        
        const memberOptions = members.map((member: Member) => ({
          value: member.id,
          label: `${member.name} (${member.floor})`,
        }));
        setActiveMembers(memberOptions);

        // Update form data with settings
        setFormData(prev => ({
          ...prev,
          secondFloorCount: settings.activememberCounts?.byFloor?.['2nd'] || 0,
          thirdFloorCount: settings.activememberCounts?.byFloor?.['3rd'] || 0,
          wifiAmount: settings.wifiMonthlyCharge,
        }));
      }).catch(console.error);
    }
  }, [opened, getGlobalSettings, getMembers]);

  const expenseCombobox = useCombobox({
    onDropdownClose: () => expenseCombobox.resetSelectedOption(),
    onDropdownOpen: () => expenseCombobox.updateSelectedOptionIndex('active'),
  });

  const wifiCombobox = useCombobox({
    onDropdownClose: () => wifiCombobox.resetSelectedOption(),
    onDropdownOpen: () => wifiCombobox.updateSelectedOptionIndex('active'),
  });

  // Filter and limit options for MaxDisplayedItems pattern
  const MAX_DISPLAYED_OPTIONS = 5;

  const expenseOptions = activeMembers.slice(0, MAX_DISPLAYED_OPTIONS);
  const wifiOptions = activeMembers.slice(0, MAX_DISPLAYED_OPTIONS);

  useEffect(() => {
    // Member counts are now initialized from DataProvider above
    // This effect is no longer needed but kept for any future initialization
  }, []);

  // Helper functions for multi-select (following Mantine MaxDisplayedItems pattern)
  const handleExpenseMemberSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      expenseMemberIds: prev.expenseMemberIds.includes(value)
        ? prev.expenseMemberIds.filter((id) => id !== value)
        : [...prev.expenseMemberIds, value],
    }));
  };

  const handleWifiMemberSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      wifiMemberIds: prev.wifiMemberIds.includes(value)
        ? prev.wifiMemberIds.filter((id) => id !== value)
        : [...prev.wifiMemberIds, value],
    }));
  };

  const removeExpenseMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      expenseMemberIds: prev.expenseMemberIds.filter((id) => id !== memberId),
    }));
  };

  const removeWifiMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      wifiMemberIds: prev.wifiMemberIds.filter((id) => id !== memberId),
    }));
  };

  const handleGenerateBills = async () => {
    setLoading(true);
    try {
      // Call actual Firebase function
      await FirestoreService.Billing.generateBulkBills({
        billingMonth: formData.billingMonth.toISOString().slice(0, 7), // YYYY-MM format
        floorElectricity: {
          '2nd': formData.secondFloorElectricity,
          '3rd': formData.thirdFloorElectricity,
        },
        floorMemberCounts: {
          '2nd': formData.secondFloorCount,
          '3rd': formData.thirdFloorCount,
        },
        bulkExpenses: formData.expenseAmount > 0 ? [{
          memberIds: formData.expenseMemberIds,
          amount: formData.expenseAmount,
          description: formData.expenseDescription,
        }] : [],
        wifiCharges: formData.wifiMemberIds.length > 0 ? {
          memberIds: formData.wifiMemberIds,
          amount: formData.wifiAmount,
        } : undefined,
      });

      notifications.show({
        title: 'Success',
        message: 'Bills generated successfully for all active members',
        color: 'green',
      });

      onClose();
      setFormData({
        billingMonth: new Date(),
        secondFloorElectricity: 0,
        thirdFloorElectricity: 0,
        memberCountEditable: false,
        secondFloorCount: globalSettings?.activememberCounts?.byFloor?.['2nd'] ?? 0,
        thirdFloorCount: globalSettings?.activememberCounts?.byFloor?.['3rd'] ?? 0,
        expenseMemberIds: [],
        expenseAmount: 0,
        expenseDescription: '',
        wifiMemberIds: [],
        wifiAmount: globalSettings?.wifiMonthlyCharge ?? 0,
      });
    } catch (error) {
      console.error('Error generating bills:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to generate bills. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SharedModal
      opened={opened}
      onClose={onClose}
      title='Generate Bills'
      loading={loading}
      primaryActionText='Generate Bills'
      onPrimaryAction={handleGenerateBills}
      size='md'>
      <Stack gap='md'>
        <Text size='sm' c='dimmed'>
          Generate monthly bills for all active members with electricity charges distributed by floor.
        </Text>

        <MonthPickerInput
          label='Billing Month'
          placeholder='Select billing month'
          value={
            formData.billingMonth && formData.billingMonth instanceof Date
              ? formData.billingMonth.toISOString().slice(0, 7)
              : null
          }
          onChange={(value: string | null) => {
            if (value) {
              // Convert string (YYYY-MM) to Date object
              const [year, month] = value.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1, 1);
              setFormData((prev) => ({ ...prev, billingMonth: date }));
            } else {
              setFormData((prev) => ({ ...prev, billingMonth: new Date() }));
            }
          }}
          required
        />

        <Group grow>
          <NumberInput
            label='2nd Floor Electricity'
            placeholder='Enter electricity bill amount'
            value={formData.secondFloorElectricity}
            onChange={(value) => setFormData((prev) => ({ ...prev, secondFloorElectricity: Number(value) || 0 }))}
            prefix='₹'
            min={0}
            required
          />
          <NumberInput
            label='3rd Floor Electricity'
            placeholder='Enter electricity bill amount'
            value={formData.thirdFloorElectricity}
            onChange={(value) => setFormData((prev) => ({ ...prev, thirdFloorElectricity: Number(value) || 0 }))}
            prefix='₹'
            min={0}
            required
          />
        </Group>

        <Divider label='Member Counts' labelPosition='center' />

        <Group grow>
          <NumberInput
            label='2nd Floor Member Count'
            placeholder='Number of members'
            value={formData.secondFloorCount}
            onChange={(value) => setFormData((prev) => ({ ...prev, secondFloorCount: Number(value) || 0 }))}
            min={0}
            readOnly={!formData.memberCountEditable}
          />
          <NumberInput
            label='3rd Floor Member Count'
            placeholder='Number of members'
            value={formData.thirdFloorCount}
            onChange={(value) => setFormData((prev) => ({ ...prev, thirdFloorCount: Number(value) || 0 }))}
            min={0}
            readOnly={!formData.memberCountEditable}
          />
        </Group>

        <Button
          variant='light'
          size='xs'
          onClick={() => setFormData((prev) => ({ ...prev, memberCountEditable: !prev.memberCountEditable }))}>
          {formData.memberCountEditable ? 'Use Auto Count' : 'Edit Member Count'}
        </Button>

        <Divider label='Additional Charges' labelPosition='center' />

        {/* Single Expense Section - Always Visible */}
        <Stack gap='sm'>
          <Text fw={500} size='sm'>
            Member Expense
          </Text>

          <Combobox store={expenseCombobox} onOptionSubmit={handleExpenseMemberSelect} withinPortal={false}>
            <Combobox.DropdownTarget>
              <PillsInput pointer onClick={() => expenseCombobox.toggleDropdown()}>
                <Pill.Group>
                  {formData.expenseMemberIds.length > 0 ? (
                    <>
                      {formData.expenseMemberIds
                        .slice(
                          0,
                          MAX_DISPLAYED_OPTIONS === formData.expenseMemberIds.length
                            ? MAX_DISPLAYED_OPTIONS
                            : MAX_DISPLAYED_OPTIONS - 1
                        )
                        .map((memberId) => {
                          const member = activeMembers.find((m) => m.value === memberId);
                          return member ? (
                            <Pill key={memberId} withRemoveButton onRemove={() => removeExpenseMember(memberId)}>
                              {member.label}
                            </Pill>
                          ) : null;
                        })}
                      {formData.expenseMemberIds.length > MAX_DISPLAYED_OPTIONS && (
                        <Pill>+{formData.expenseMemberIds.length - (MAX_DISPLAYED_OPTIONS - 1)} more</Pill>
                      )}
                    </>
                  ) : (
                    <Input.Placeholder>Search members for expense</Input.Placeholder>
                  )}

                  <Combobox.EventsTarget>
                    <PillsInput.Field
                      type='hidden'
                      onBlur={() => expenseCombobox.closeDropdown()}
                      onKeyDown={(event) => {
                        if (event.key === 'Backspace') {
                          event.preventDefault();
                          removeExpenseMember(formData.expenseMemberIds[formData.expenseMemberIds.length - 1]);
                        }
                      }}
                    />
                  </Combobox.EventsTarget>
                </Pill.Group>
              </PillsInput>
            </Combobox.DropdownTarget>

            <Combobox.Dropdown>
              <Combobox.Options>
                {expenseOptions.map((item) => (
                  <Combobox.Option
                    value={item.value}
                    key={item.value}
                    active={formData.expenseMemberIds.includes(item.value)}>
                    <Group gap='sm'>
                      {formData.expenseMemberIds.includes(item.value) ? <CheckIcon size={12} /> : null}
                      <span>{item.label}</span>
                    </Group>
                  </Combobox.Option>
                ))}
                {activeMembers.length > MAX_DISPLAYED_OPTIONS && (
                  <Text size='xs' c='dimmed' p='xs'>
                    {activeMembers.length - MAX_DISPLAYED_OPTIONS} more options available...
                  </Text>
                )}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>

          <Group grow>
            <TextInput
              label='Description'
              placeholder='Enter expense description'
              value={formData.expenseDescription}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, expenseDescription: event.currentTarget?.value ?? '' }))
              }
            />
            <NumberInput
              label='Amount'
              placeholder='0'
              value={formData.expenseAmount}
              onChange={(value) => setFormData((prev) => ({ ...prev, expenseAmount: Number(value) || 0 }))}
              prefix='₹'
              min={0}
            />
          </Group>
        </Stack>

        {/* Single WiFi Charge Section - Always Visible */}
        <Stack gap='sm'>
          <Text fw={500} size='sm'>
            WiFi Charge
          </Text>

          <Combobox store={wifiCombobox} onOptionSubmit={handleWifiMemberSelect} withinPortal={false}>
            <Combobox.DropdownTarget>
              <PillsInput pointer onClick={() => wifiCombobox.toggleDropdown()}>
                <Pill.Group>
                  {formData.wifiMemberIds.length > 0 ? (
                    <>
                      {formData.wifiMemberIds
                        .slice(
                          0,
                          MAX_DISPLAYED_OPTIONS === formData.wifiMemberIds.length
                            ? MAX_DISPLAYED_OPTIONS
                            : MAX_DISPLAYED_OPTIONS - 1
                        )
                        .map((memberId) => {
                          const member = activeMembers.find((m) => m.value === memberId);
                          return member ? (
                            <Pill key={memberId} withRemoveButton onRemove={() => removeWifiMember(memberId)}>
                              {member.label}
                            </Pill>
                          ) : null;
                        })}
                      {formData.wifiMemberIds.length > MAX_DISPLAYED_OPTIONS && (
                        <Pill>+{formData.wifiMemberIds.length - (MAX_DISPLAYED_OPTIONS - 1)} more</Pill>
                      )}
                    </>
                  ) : (
                    <Input.Placeholder>Search members for wifi charge</Input.Placeholder>
                  )}

                  <Combobox.EventsTarget>
                    <PillsInput.Field
                      type='hidden'
                      onBlur={() => wifiCombobox.closeDropdown()}
                      onKeyDown={(event) => {
                        if (event.key === 'Backspace') {
                          event.preventDefault();
                          removeWifiMember(formData.wifiMemberIds[formData.wifiMemberIds.length - 1]);
                        }
                      }}
                    />
                  </Combobox.EventsTarget>
                </Pill.Group>
              </PillsInput>
            </Combobox.DropdownTarget>

            <Combobox.Dropdown>
              <Combobox.Options>
                {wifiOptions.map((item) => (
                  <Combobox.Option
                    value={item.value}
                    key={item.value}
                    active={formData.wifiMemberIds.includes(item.value)}>
                    <Group gap='sm'>
                      {formData.wifiMemberIds.includes(item.value) ? <CheckIcon size={12} /> : null}
                      <span>{item.label}</span>
                    </Group>
                  </Combobox.Option>
                ))}
                {activeMembers.length > MAX_DISPLAYED_OPTIONS && (
                  <Text size='xs' c='dimmed' p='xs'>
                    {activeMembers.length - MAX_DISPLAYED_OPTIONS} more options available...
                  </Text>
                )}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>

          <NumberInput
            label='Amount'
            placeholder='30'
            value={formData.wifiAmount}
            onChange={(value) => setFormData((prev) => ({ ...prev, wifiAmount: Number(value) || 0 }))}
            prefix='₹'
            min={0}
          />
        </Stack>
      </Stack>
    </SharedModal>
  );
}
