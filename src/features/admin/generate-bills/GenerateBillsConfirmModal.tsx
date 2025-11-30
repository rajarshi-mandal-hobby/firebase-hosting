import {
  Accordion,
  Badge,
  Button,
  Group,
  List,
  Modal,
  Stack,
  Title,
  Text,
} from '@mantine/core';
import type { GenerateBillFormData } from './hooks/useGenerateBillsForm';
import { useCategorizeMembersByExpense } from './hooks/useCategorizeMembersByExpense';
import { computePerHeadBill } from '../../../shared/utils';

interface GenerateBillsConfirmModalProps {
  opened: boolean;
  close: () => void;
  formData: GenerateBillFormData | null;
  onConfirm: () => void;
}

const GenerateBillsConfirmModal = ({ opened, close, formData, onConfirm }: GenerateBillsConfirmModalProps) => {
  const { secondFloorExpenseMembers, thirdFloorExpenseMembers, otherExpenseMembers, memberOptionsLookup } =
    useCategorizeMembersByExpense(formData, opened);

  return (
    <Modal opened={opened} onClose={close} title='Confirm Bill Generation' centered>
      {formData && (
        <Stack gap='xl'>
          <Stack gap='xs'>
            <Title order={6}>Electric Bills:</Title>
            <Group grow>
              <Text size='sm' fw={500}>
                2nd Floor:
              </Text>
              <Text size='sm'>
                ₹{formData.secondFloorElectricityBill} ÷ {formData.activeMemberCounts['2nd']}
              </Text>
              <Badge size='lg' variant='outline'>
                ₹{computePerHeadBill(formData.secondFloorElectricityBill, formData.activeMemberCounts['2nd'])}
              </Badge>
            </Group>
            <Group grow>
              <Text size='sm' fw={500}>
                3rd Floor:
              </Text>
              <Text size='sm'>
                ₹{formData.thirdFloorElectricityBill} ÷ {formData.activeMemberCounts['3rd']}
              </Text>
              <Badge size='lg' variant='outline'>
                ₹{computePerHeadBill(formData.thirdFloorElectricityBill, formData.activeMemberCounts['3rd'])}
              </Badge>
            </Group>
          </Stack>
          <Accordion variant='separated'>
            {/* WiFi Charges Section */}
            {formData.wifiCharges.wifiMemberIds.length > 0 && !!formData.wifiCharges.wifiMonthlyCharge && (
              <Accordion.Item value='wifi-charges'>
                <Accordion.Control>
                  <Title order={6}>
                    WiFi Charges: ₹
                    {computePerHeadBill(
                      formData.wifiCharges.wifiMonthlyCharge,
                      formData.wifiCharges.wifiMemberIds.length
                    )}
                    /Member
                  </Title>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text size='sm' mb='sm'>
                    WiFi charges of <b>₹{formData.wifiCharges.wifiMonthlyCharge}</b> divided among:
                  </Text>
                  {/* Show list of members if WiFi charges are being applied */}
                  <List size='sm'>
                    {formData.wifiCharges.wifiMemberIds.map((id) => (
                      <List.Item key={id}>{memberOptionsLookup[id]}</List.Item>
                    ))}
                  </List>
                </Accordion.Panel>
              </Accordion.Item>
            )}
            {/* Additional Expenses Section */}
            {formData.additionalExpenses.addExpenseMemberIds.length > 0 &&
              !!formData.additionalExpenses.addExpenseAmount && (
                <Accordion.Item value='additional-expenses'>
                  <Accordion.Control>
                    <Title order={6} lineClamp={1}>
                      Additional Expenses: ₹
                      {computePerHeadBill(
                        formData.additionalExpenses.addExpenseAmount,
                        formData.additionalExpenses.addExpenseMemberIds.length
                      )}
                      /Member
                    </Title>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text size='sm' mb={0} fw={500}>
                      Reason:
                    </Text>
                    <Text size='sm' mb='md'>
                      {formData.additionalExpenses.addExpenseDescription}
                    </Text>
                    <Text size='sm' mb='sm'>
                      Expense of <b>₹{formData.additionalExpenses.addExpenseAmount}</b> divided among:
                    </Text>
                    {/* Show members by floor */}
                    <Text size='sm' mb={4} fw={500}>
                      2nd Floor Members: {secondFloorExpenseMembers.length || <i>None</i>}
                    </Text>
                    {secondFloorExpenseMembers.length > 0 && (
                      <List size='sm'>
                        {secondFloorExpenseMembers.map((name, index) => (
                          <List.Item key={index}>{name}</List.Item>
                        ))}
                      </List>
                    )}
                    <Text size='sm' mb={4} fw={500} mt='md'>
                      3rd Floor Members: {thirdFloorExpenseMembers.length || <i>None</i>}
                    </Text>
                    {thirdFloorExpenseMembers.length > 0 && (
                      <List size='sm'>
                        {thirdFloorExpenseMembers.map((name, index) => (
                          <List.Item key={index}>{name}</List.Item>
                        ))}
                      </List>
                    )}
                    {otherExpenseMembers.length > 0 && (
                      <Text size='sm' mb='sm' mt='md'>
                        <span style={{ fontWeight: 500 }}>Other Members:</span> {otherExpenseMembers.join(', ')}
                      </Text>
                    )}
                  </Accordion.Panel>
                </Accordion.Item>
              )}
          </Accordion>

          <Group mt='md' align='center' justify='space-between'>
            <Button variant='outline' onClick={close}>
              Cancel
            </Button>
            <Group justify='flex-end'>
              <Button onClick={onConfirm}>{formData.isUpdatingBills ? 'Update' : 'Generate'}</Button>
            </Group>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};
export default GenerateBillsConfirmModal;
