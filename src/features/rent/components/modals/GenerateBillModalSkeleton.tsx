import { Divider, Group, Skeleton, Stack, Text } from '@mantine/core';

export const GenerateBillModalSkeleton = () => (
  <Stack gap='lg'>
    <Group gap='xs' align='center'>
      <Text size='sm' fw={500} flex={1}>
        Billing Month:
      </Text>
      <Skeleton height={36} flex={2} radius='lg' />
    </Group>

    <Divider label='Electricity Charges' labelPosition='left' mt='md' />

    <Group align='flex-end' justify='center'>
      <Skeleton height={80} flex={2} radius='lg' />
      <Skeleton height={80} flex={1} radius='lg' />
    </Group>

    <Group align='flex-end' justify='center'>
      <Skeleton height={80} flex={2} radius='lg' />
      <Skeleton height={80} flex={1} radius='lg' />
    </Group>

    <Divider label='Additional Charges' labelPosition='left' mt='lg' />

    <Skeleton height={20} />
    <Skeleton height={20} />

    <Group align='center' justify='center'>
      <Skeleton height={61} flex={2} />
      <Skeleton height={61} flex={1} />
    </Group>
    <Skeleton height={61} />

    <Divider label='WiFi Charges' labelPosition='left' mt='md' />

    <Group align='center' justify='center'>
      <Skeleton height={120} flex={2} />
      <Skeleton height={80} flex={1} />
    </Group>

    <Group justify='space-between' align='center' mt='md'>
      <Skeleton height={20} width={84} />
      <Group justify='flex-end'>
        <Skeleton width={76} height={36}/>
        <Skeleton width={100} height={36}/>
      </Group>
    </Group>
  </Stack>
);
{/* <Stack gap='lg'>
          <Group gap='xs' align='center'>
            <Text size='sm' fw={500} flex={1}>
              Billing Month:
            </Text>
            <MonthPickerInput
              key={form.key('billingMonths.nextBillingMonth')}
              defaultValue={data.billingMonths.nextBillingMonth.toDate()}
              minDate={data.billingMonths.currentBillingMonth.toDate()}
              maxDate={data.billingMonths.nextBillingMonth.toDate()}
              required
              flex={2}
              {...form.getInputProps('billingMonths.nextBillingMonth')}
            />
          </Group>

          <Divider label='Electricity Charges' labelPosition='left' mt='md' />

          <Group align='flex-end'>
            <NumberInputWithCurrency
              required
              label='2nd Floor'
              description={`₹${floorBillAmounts['2nd']} per member`}
              placeholder='500'
              min={0}
              flex={2}
              key={form.key('secondFloorElectricityBill')}
              {...form.getInputProps('secondFloorElectricityBill')}
            />
            <NumberInput
              required
              description='Number of members'
              placeholder='6'
              flex={1}
              min={0}
              key={form.key('activeMemberCounts.2nd')}
              {...form.getInputProps('activeMemberCounts.2nd')}
            />
          </Group>

          <Group align='flex-end'>
            <NumberInputWithCurrency
              required
              label='3rd Floor'
              description={`₹${floorBillAmounts['3rd']} per member`}
              placeholder='500'
              min={0}
              flex={2}
              key={form.key('thirdFloorElectricityBill')}
              {...form.getInputProps('thirdFloorElectricityBill')}
            />
            <NumberInput
              required
              description='Number of members'
              placeholder='6'
              flex={1}
              min={0}
              key={form.key('activeMemberCounts.3rd')}
              {...form.getInputProps('activeMemberCounts.3rd')}
            />
          </Group>

          <Divider label='Additional Charges' labelPosition='left' mt='lg' />

          <Switch
            label='Add All Members on 2nd Floor'
            checked={isFloorSelected('2nd')}
            onChange={(event) => toggleFloorExpense('2nd', event.currentTarget.checked)}
          />
          <Switch
            label='Add All Members on 3rd Floor'
            checked={isFloorSelected('3rd')}
            onChange={(event) => toggleFloorExpense('3rd', event.currentTarget.checked)}
          />

          <Group align='center' justify='center'>
            <MultiSelect
              label='Select Members'
              data={activeMembers}
              placeholder='Select members'
              hidePickedOptions
              maxDropdownHeight={200}
              comboboxProps={{
                transitionProps: { transition: 'scale', duration: 200 },
                shadow: 'md',
              }}
              flex={2}
              key={form.key('additionalExpenses.addExpenseMemberIds')}
              {...form.getInputProps('additionalExpenses.addExpenseMemberIds')}
            />
            <NumberInputWithCurrency
              label='Amount'
              flex={1}
              placeholder='100'
              key={form.key('additionalExpenses.addExpenseAmount')}
              {...form.getInputProps('additionalExpenses.addExpenseAmount')}
            />
          </Group>
          <Textarea
            label='Description'
            autosize
            minRows={1}
            bdrs='xl'
            placeholder='Enter expense description'
            key={form.key('additionalExpenses.addExpenseDescription')}
            {...form.getInputProps('additionalExpenses.addExpenseDescription')}
          />

          <Divider label='WiFi Charges' labelPosition='left' mt='md' />

          <Group align='center' justify='center'>
            <MultiSelect
              label='WiFi Members'
              data={activeMembers}
              placeholder='Select members'
              hidePickedOptions
              maxDropdownHeight={200}
              comboboxProps={{
                transitionProps: { transition: 'scale', duration: 200 },
                shadow: 'md',
              }}
              flex={2}
              key={form.key('wifiCharges.wifiMemberIds')}
              {...form.getInputProps('wifiCharges.wifiMemberIds')}
            />

            <NumberInputWithCurrency
              label='Amount'
              placeholder='600'
              flex={1}
              step={50}
              key={form.key('wifiCharges.wifiMonthlyCharge')}
              {...form.getInputProps('wifiCharges.wifiMonthlyCharge')}
            />
          </Group>

          <Group justify='space-between' align='center' mt='md'>
            <Button variant='transparent' onClick={onClose}>
              Cancel
            </Button>
            <Group justify='flex-end'>
              <Button
                variant='outline'
                disabled={!form.isDirty()}
                onClick={() => {
                  form.reset();
                }}>
                Reset
              </Button>
              <Button type='submit' loading={isPending} disabled={!form.isDirty()}>
                {isUpdating ? 'Update' : 'Generate'}
              </Button>
            </Group>
          </Group>
        </Stack> */}
