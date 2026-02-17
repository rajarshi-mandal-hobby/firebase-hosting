import { Modal, Stack, Title, SimpleGrid, Accordion, List, Group, Button, Text } from '@mantine/core';
import { type BillsConfirmModalFormData, useBillsConfirmModal } from '../hooks/useBillsConfirmModal';
import { computePerHeadBill } from '../utils';
import { toIndianLocale } from '../../../../shared/utils';

interface GenerateBillsConfirmModalProps {
    opened: boolean;
    formData: BillsConfirmModalFormData | null;
    close: () => void;
    onConfirm: () => void;
}

export const GenerateBillsConfirmModal = ({ opened, close, formData, onConfirm }: GenerateBillsConfirmModalProps) => {
    const { expenseMembers, additionalExpensesPerHead, wifiMembers, wifiChargesPerHead } = useBillsConfirmModal(
        formData,
        opened
    );

    return (
        <Modal opened={opened} onClose={close} title='Confirm Bill Generation' centered>
            {formData && (
                <Stack gap='xl'>
                    <Stack gap='xs'>
                        <Title order={6}>Calculations:</Title>
                        <SimpleGrid cols={3} spacing='0'>
                            <Text fw={500}>2nd Floor:</Text>
                            <Text>
                                ₹{formData.secondFloorElectricityBill} ÷ {formData.activeMemberCounts['2nd']}
                            </Text>
                            <Text fw={700}>
                                {toIndianLocale(
                                    computePerHeadBill(
                                        formData.secondFloorElectricityBill,
                                        formData.activeMemberCounts['2nd']
                                    )
                                )}
                                /Member
                            </Text>
                        </SimpleGrid>
                        <SimpleGrid cols={3} spacing='0'>
                            <Text fw={500}>3rd Floor:</Text>
                            <Text>
                                ₹{formData.thirdFloorElectricityBill} ÷ {formData.activeMemberCounts['3rd']}
                            </Text>
                            <Text fw={700}>
                                {toIndianLocale(
                                    computePerHeadBill(
                                        formData.thirdFloorElectricityBill,
                                        formData.activeMemberCounts['3rd']
                                    )
                                )}
                                /Member
                            </Text>
                        </SimpleGrid>
                    </Stack>
                    <Accordion variant='separated'>
                        {/* WiFi Charges Section */}
                        {wifiChargesPerHead > 0 && (
                            <AccordionItem
                                title={`WiFi Charges: ${toIndianLocale(wifiChargesPerHead)}/Head`}
                                accordionValue='wifi-charges'
                            >
                                <Text size='sm' mb='sm'>
                                    WiFi charges of <b>₹{formData.wifiCharges.wifiMonthlyCharge}</b> divided among:
                                </Text>
                                {/* Show list of members if WiFi charges are being applied */}
                                <List size='sm'>
                                    {wifiMembers.map((memberName, index) => (
                                        <List.Item key={index + memberName}>{memberName}</List.Item>
                                    ))}
                                </List>
                            </AccordionItem>
                        )}
                        {/* Additional Expenses Section */}
                        {additionalExpensesPerHead > 0 && (
                            <AccordionItem
                                title={`Expenses: ${toIndianLocale(additionalExpensesPerHead)}/Head`}
                                accordionValue='additional-expenses'
                            >
                                <Text>
                                    Expense of <b>₹{formData.additionalExpenses.addExpenseAmount}</b> divided among:
                                </Text>
                                {/* Show members by floor */}
                                <Text fw={700} mt='md'>
                                    2nd Floor Members: {expenseMembers['2nd'].length || 'None'}
                                </Text>
                                {expenseMembers['2nd'].length > 0 && (
                                    <List size='sm'>
                                        {expenseMembers['2nd'].map((name, index) => (
                                            <List.Item key={index + name}>{name}</List.Item>
                                        ))}
                                    </List>
                                )}
                                <Text fw={700} mt='md'>
                                    3rd Floor Members: {expenseMembers['3rd'].length || 'None'}
                                </Text>
                                {expenseMembers['3rd'].length > 0 && (
                                    <List size='sm'>
                                        {expenseMembers['3rd'].map((name, index) => (
                                            <List.Item key={index + name}>{name}</List.Item>
                                        ))}
                                    </List>
                                )}
                                <Text fw={700} mt='md'>
                                    Reason:
                                </Text>
                                <Text>{formData.additionalExpenses.addExpenseDescription}</Text>
                            </AccordionItem>
                        )}
                    </Accordion>

                    <Group align='center' justify='flex-end'>
                        <Button variant='transparent' onClick={close}>
                            Cancel
                        </Button>
                        <Button onClick={onConfirm}>{formData.isUpdatingBills ? 'Update' : 'Generate'}</Button>
                    </Group>
                </Stack>
            )}
        </Modal>
    );
};

function AccordionItem({
    title,
    accordionValue,
    children
}: {
    title: string;
    accordionValue: string;
    children: React.ReactNode;
}) {
    return (
        <Accordion.Item value={accordionValue} id={accordionValue}>
            <Accordion.Control bg='gray.1'>
                <Text fw={700} lineClamp={1}>
                    {title}
                </Text>
            </Accordion.Control>
            <Accordion.Panel mt='sm'>{children}</Accordion.Panel>
        </Accordion.Item>
    );
}
