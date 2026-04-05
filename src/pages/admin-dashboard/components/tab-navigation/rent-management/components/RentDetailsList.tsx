import { Table, List } from '@mantine/core';
import { type ReactNode } from 'react';
import { type RentHistory } from '../../../../../../data/types';
import { GroupIcon } from '../../../../../../shared/components';
import {
    IconUniversalCurrency,
    IconBulb,
    IconWifi,
    IconPayments,
    IconMoneyBag,
    IconRupee,
    IconNote
} from '../../../../../../shared/icons';
import { getStatusTitle, toIndianLocale, StatusBadge } from '../../../../../../shared/utils';

interface TableRowProps {
    heading: string;
    value: string;
    icon: ReactNode;
    withBorder?: boolean;
    boldFont?: boolean;
}

const TableRow = ({ heading, value, icon, withBorder = true, boldFont = false }: TableRowProps) => (
    <Table.Tr style={withBorder ? undefined : { borderBottom: 'none' }}>
        <Table.Th pl={0} fw={500} w={180}>
            <GroupIcon>
                {icon}
                {heading}
            </GroupIcon>
        </Table.Th>
        <Table.Td pr={0} fw={boldFont ? 700 : 400}>
            {value}
        </Table.Td>
    </Table.Tr>
);

interface RentDetailsListProps {
    rentHistory: RentHistory;
}

const useRentDetailsList = ({ rentHistory: { expenses, status } }: RentDetailsListProps) => ({
    expensesTotal: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    statusTitle: getStatusTitle(status)
});

export const RentDetailsList = ({ rentHistory }: RentDetailsListProps) => {
    const { expensesTotal, statusTitle } = useRentDetailsList({ rentHistory });
    const {
        expenses,
        status,
        rent,
        electricity,
        wifi,
        totalCharges,
        amountPaid,
        currentOutstanding,
        note,
        id,
        previousOutstanding
    } = rentHistory;

    return (
        <Table layout='fixed' verticalSpacing='sm' key={'rent_' + id}>
            <Table.Tbody>
                <TableRow heading='Rent' value={toIndianLocale(rent)} icon={<IconUniversalCurrency />} />
                <TableRow heading='Electricity' value={toIndianLocale(electricity)} icon={<IconBulb />} />
                <TableRow heading='WiFi' value={toIndianLocale(wifi)} icon={<IconWifi />} />

                {expenses.length > 0 && (
                    <>
                        <TableRow
                            heading='Expenses'
                            value={toIndianLocale(expensesTotal)}
                            icon={<IconUniversalCurrency />}
                            withBorder={false}
                        />
                        <Table.Tr>
                            <Table.Td colSpan={2} px={0} pt={0}>
                                <List listStyleType='disc' spacing='xs' size='sm'>
                                    {expenses.map((expense, idx) => (
                                        <List.Item key={idx + id}>
                                            {expense.description}: {toIndianLocale(expense.amount)}
                                        </List.Item>
                                    ))}
                                </List>
                            </Table.Td>
                        </Table.Tr>
                    </>
                )}

                {previousOutstanding > 0 && (
                    <TableRow
                        heading='Previous Outstanding'
                        value={toIndianLocale(previousOutstanding)}
                        icon={<IconRupee />}
                    />
                )}

                <TableRow heading='Total Charges' value={toIndianLocale(totalCharges)} icon={<IconPayments />} />
                <TableRow heading='Amount Paid' value={toIndianLocale(amountPaid)} icon={<IconMoneyBag />} />
                <TableRow
                    heading='Outstanding'
                    value={toIndianLocale(currentOutstanding)}
                    icon={<IconRupee />}
                    boldFont
                />
                <TableRow heading='Status' value={statusTitle} icon={<StatusBadge status={status} />} />

                {!!note && (
                    <>
                        <TableRow heading='Note' value={''} icon={<IconNote />} withBorder={false} />
                        <Table.Tr>
                            <Table.Td colSpan={2} px={0} pt={0}>
                                {note}
                            </Table.Td>
                        </Table.Tr>
                    </>
                )}
            </Table.Tbody>
        </Table>
    );
};
