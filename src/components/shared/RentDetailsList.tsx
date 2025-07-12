import { List } from '@mantine/core';
import type { PaymentStatus, RentHistory } from '../../firestore-types';
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
import { getStatusColor, getStatusIcon } from './StatusHelper';

interface RentDetailsListProps {
  data: RentHistory;
  showStatus?: boolean;
}

export const RentDetailsList: React.FC<RentDetailsListProps> = ({ data, showStatus = false }) => {
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
        <>
          <List.Item icon={<IconUniversalCurrency size={16} />}>
            Expenses: <CurrencyFormatter value={data.expenses.reduce((sum, exp) => sum + exp.amount, 0)} />
          </List.Item>
          <List withPadding size='sm' listStyleType='disc' mt='xs'>
            {data.expenses.map((expense, idx) => (
              <List.Item key={idx}>
                {expense.description}: <CurrencyFormatter value={expense.amount} />
              </List.Item>
            ))}
          </List>
        </>
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
      {data.note && <List.Item icon={<IconNotes size={16} />}>Note: {data.note}</List.Item>}

      {showStatus && data.status && (
        <List.Item
          fw={500}
          c={getStatusColor(data.status as PaymentStatus)}
          icon={
            <MyThemeIcon
              icon={getStatusIcon(data.status as PaymentStatus)}
              size={16}
              color={getStatusColor(data.status as PaymentStatus)}
            />
          }>
          Status: {data.status}
        </List.Item>
      )}
    </List>
  );
};
