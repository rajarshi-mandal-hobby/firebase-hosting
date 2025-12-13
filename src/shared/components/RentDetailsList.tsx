import { Group, List, Table } from '@mantine/core';
import type { RentHistory } from '../types/firestore-types';
import { formatNumberIndianLocale, getStatusAlertConfig, StatusBadge } from '../utils';
import { IconUniversalCurrency, IconBulb, IconWifi, IconPayments, IconMoneyBag, IconNote, IconRupee } from '../icons';
import type { ReactNode } from 'react';

const ICON_SIZE = 14;

type TableRowProps = {
  heading: string;
  value: any;
  Icon: React.ComponentType<{ size: number }> | ReactNode;
  hasExpenses?: boolean;
  boldFont?: boolean;
};

const TableRow = ({ heading, value, Icon, hasExpenses = false, boldFont = false }: TableRowProps) => (
  <Table.Tr style={hasExpenses ? { borderBottom: 'none' } : undefined}>
    <Table.Th pl={0} fw={500} w={140}>
      <Group wrap="nowrap" gap="xs">
        {typeof Icon === 'function' ? <Icon size={ICON_SIZE} /> : Icon}
        {heading}
      </Group>
    </Table.Th>
    <Table.Td pr={0} fw={boldFont ? 700 : 400}>
      {value}
    </Table.Td>
  </Table.Tr>
);

interface RentDetailsListProps {
  rentHistory: RentHistory;
}

export const RentDetailsList = ({ rentHistory }: RentDetailsListProps) => {
  // ✅ Calculate once at render time, not in function
  const expensesTotal =
    rentHistory.expenses.length > 0 ? rentHistory.expenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;
  const statusConfig = getStatusAlertConfig(rentHistory.status);

  return (
    <Table layout="fixed" verticalSpacing="xs" fz="sm" key={rentHistory.id}>
      <Table.Tbody>
        <TableRow heading="Rent" value={formatNumberIndianLocale(rentHistory.rent)} Icon={IconUniversalCurrency} />
        <TableRow heading="Electricity" value={formatNumberIndianLocale(rentHistory.electricity)} Icon={IconBulb} />
        <TableRow heading="WiFi" value={formatNumberIndianLocale(rentHistory.wifi)} Icon={IconWifi} />

        {rentHistory.expenses.length > 0 && (
          <>
            <TableRow
              heading="Expenses"
              value={formatNumberIndianLocale(expensesTotal)}
              Icon={IconUniversalCurrency}
              hasExpenses
            />
            <Table.Tr>
              <Table.Td colSpan={2} p={0}>
                <List listStyleType="disc" mb="sm" spacing="xs" size="sm">
                  {rentHistory.expenses.map((expense, idx) => (
                    <List.Item key={idx}>
                      {expense.description}: ₹{expense.amount}
                    </List.Item>
                  ))}
                </List>
              </Table.Td>
            </Table.Tr>
          </>
        )}

        <TableRow
          heading="Total Charges"
          value={formatNumberIndianLocale(rentHistory.totalCharges)}
          Icon={IconPayments}
        />
        <TableRow heading="Amount Paid" value={formatNumberIndianLocale(rentHistory.amountPaid)} Icon={IconMoneyBag} />
        <TableRow
          heading="Outstanding"
          value={formatNumberIndianLocale(rentHistory.currentOutstanding)}
          Icon={IconRupee}
          boldFont
        />

        {rentHistory.outstandingNote && <TableRow heading="Note" value={rentHistory.outstandingNote} Icon={IconNote} />}

        <TableRow
          heading="Status"
          value={statusConfig.title}
          Icon={<StatusBadge size={ICON_SIZE} status={rentHistory.status} />}
        />
      </Table.Tbody>
    </Table>
  );
};
