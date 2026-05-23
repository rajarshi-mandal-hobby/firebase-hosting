import { Table, List } from '@mantine/core';
import type { ReactNode } from 'react';
import { TABLE_HEADER_WIDTH, type RentHistory } from '../../../../../../data/types';
import { GroupIcon } from '../../../../../../shared/components';
import {
    IconUniversalCurrency,
    IconBulb,
    IconWifi,
    IconRupee,
    IconPayments,
    IconMoneyBag,
    IconNote
} from '../../../../../../shared/icons';
import { getStatusTitle, toIndianLocale, StatusBadge } from '../../../../../../shared/utils';

interface TableRowProps {
    title: string;
    value: string;
    icon: ReactNode;
    withBorder?: boolean;
    boldFont?: boolean;
}

const TableRow = ({ title, value, icon, withBorder = true, boldFont = false }: TableRowProps) => (
    <Table.Tr style={withBorder ? undefined : { borderBottom: 'none' }}>
        <Table.Td pl={0} fw={500} w={TABLE_HEADER_WIDTH}>
            <GroupIcon>
                {icon}
                {title}
            </GroupIcon>
        </Table.Td>
        <Table.Td pr={0} fw={boldFont ? 700 : 400}>
            {value}
        </Table.Td>
    </Table.Tr>
);

interface RentDetailsListProps {
    rentHistory: RentHistory;
    memberId: string;
}

export const RentDetailsList = ({
    rentHistory: {
        expenses,
        status,
        rent,
        electricity,
        wifi,
        totalCharges,
        prevOutstanding,
        amountPaid,
        outstanding,
        note
    },
    memberId
}: RentDetailsListProps) => {
    const hasExpenses = !!expenses.length;
    const expensesTotal = hasExpenses ? expenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;
    const statusTitle = getStatusTitle(status);

    return (
        <Table layout='fixed' verticalSpacing='sm'>
            <Table.Tbody>
                <TableRow title='Rent' value={toIndianLocale(rent)} icon={<IconUniversalCurrency />} />
                <TableRow title='Electricity' value={toIndianLocale(electricity)} icon={<IconBulb />} />
                <TableRow title='WiFi' value={toIndianLocale(wifi)} icon={<IconWifi />} />

                {hasExpenses && (
                    <>
                        <TableRow
                            title='Expenses'
                            value={toIndianLocale(expensesTotal)}
                            icon={<IconUniversalCurrency />}
                            withBorder={false}
                        />
                        <Table.Tr>
                            <Table.Td colSpan={2} px={0} pt={0}>
                                <List listStyleType='disc' spacing='xs' size='sm'>
                                    {expenses.map((expense) => (
                                        <List.Item key={'expense_' + memberId}>
                                            {expense.description}: {toIndianLocale(expense.amount)}
                                        </List.Item>
                                    ))}
                                </List>
                            </Table.Td>
                        </Table.Tr>
                    </>
                )}

                {!!prevOutstanding && (
                    <TableRow
                        title='Previous Outstanding'
                        value={toIndianLocale(prevOutstanding)}
                        icon={<IconRupee />}
                    />
                )}

                <TableRow title='Total Charges' value={toIndianLocale(totalCharges)} icon={<IconPayments />} />
                <TableRow title='Amount Paid' value={toIndianLocale(amountPaid)} icon={<IconMoneyBag />} />
                <TableRow title='Outstanding' value={toIndianLocale(outstanding)} icon={<IconRupee />} boldFont />

                {!!note && (
                    <>
                        <TableRow title='Note' value={''} icon={<IconNote />} withBorder={false} />
                        <Table.Tr>
                            <Table.Td colSpan={2} px={0} pt={0}>
                                {note}
                            </Table.Td>
                        </Table.Tr>
                    </>
                )}

                <TableRow title='Status' value={statusTitle} icon={<StatusBadge status={status} />} />
            </Table.Tbody>
        </Table>
    );
};
