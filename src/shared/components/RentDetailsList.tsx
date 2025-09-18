import { List } from '@mantine/core';
import { memo, useMemo } from 'react';
import type { RentHistory, PaymentStatus } from '../types/firestore-types';
import { CurrencyFormatter } from './CurrencyFormatter';
import {
  IconRupee,
  IconBulb,
  IconWifi,
  IconUniversalCurrency,
  IconMoneyBag,
  IconRupeeCircle,
  IconPayments,
  IconNotes,
  MyThemeIcon,
} from './icons';
import { getStatusColor, getStatusIcon } from '../utils';

interface RentDetailsListProps {
  data: RentHistory;
  showStatus?: boolean;
}

export const RentDetailsList = memo<RentDetailsListProps>(({ data, showStatus = false }) => {
  // Memoize expensive calculations
  const expensesTotal = useMemo(() => data.expenses.reduce((sum, exp) => sum + exp.amount, 0), [data.expenses]);

  // Memoize status-related computations
  const statusInfo = useMemo(() => {
    if (!showStatus || !data.status) return null;

    const status = data.status as PaymentStatus;
    return {
      color: getStatusColor(status),
      icon: getStatusIcon(status),
      status,
    };
  }, [showStatus, data.status]);

  // Memoize expense list items to prevent unnecessary re-renders
  const expenseItems = useMemo(
    () =>
      data.expenses.map((expense, idx) => (
        <List.Item key={`${expense.description}-${idx}`}>
          {expense.description}: <CurrencyFormatter value={expense.amount} />
        </List.Item>
      )),
    [data.expenses]
  );

  return (
    <List spacing='xs' size='sm' listStyleType='none'>
      <List.Item icon={<IconRupee size={16} />}>
        Rent: <CurrencyFormatter value={data.rent} />
      </List.Item>

      <List.Item icon={<IconBulb size={16} />}>
        Electricity: <CurrencyFormatter value={data.electricity} />
      </List.Item>

      <List.Item icon={<IconWifi size={16} />}>
        WiFi: <CurrencyFormatter value={data.wifi} />
      </List.Item>

      {data.expenses.length > 0 && (
        <List.Item icon={<IconUniversalCurrency size={16} />}>
          Expenses: <CurrencyFormatter value={expensesTotal} />
          <List listStyleType='disc' mt='xs' spacing='xs' size='sm'>
            {expenseItems}
          </List>
        </List.Item>
      )}

      <List.Item icon={<IconMoneyBag size={16} />} fw={500}>
        Total: <CurrencyFormatter value={data.totalCharges} />
      </List.Item>

      <List.Item icon={<IconRupeeCircle size={16} />}>
        Amount Paid: <CurrencyFormatter value={data.amountPaid} />
      </List.Item>

      <List.Item icon={<IconPayments size={16} />} fw={500}>
        Outstanding: <CurrencyFormatter value={data.currentOutstanding} />
      </List.Item>

      {data.outstandingNote && <List.Item icon={<IconNotes size={16} />}>Note: {data.outstandingNote}</List.Item>}

      {statusInfo && (
        <List.Item
          fw={500}
          c={statusInfo.color}
          icon={<MyThemeIcon icon={statusInfo.icon} size={16} color={statusInfo.color} />}>
          Status: {statusInfo.status}
        </List.Item>
      )}
    </List>
  );
});

RentDetailsList.displayName = 'RentDetailsList';
