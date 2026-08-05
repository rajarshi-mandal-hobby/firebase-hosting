import { Table, List, Badge, ListItem, TableTd, TableTbody } from '@mantine/core';
import type { ReactNode } from 'react';
import type { RentHistory } from '../../../../data/types';
import { GroupIcon, StatusThemeIcon } from '../../../../shared/components';
import { type GoogleIconName, GoogleIcon } from '../../../../shared/icons/factory';
import { toIndianLocale, getPaymentStatusTitle } from '../../../../shared/utils';
import { TableTr } from '@mantine/core';

interface TableRowProps {
    title: string;
    value: string;
    iconName?: GoogleIconName;
    icon?: ReactNode;
    withBorder?: boolean;
    boldFont?: boolean;
}

const TableRow = ({ title, value, iconName, icon, withBorder = true, boldFont = false }: TableRowProps) => (
    <TableTr style={withBorder ? undefined : { borderBottom: 'none' }}>
        <TableTd pl={0} fw={500} width={200}>
            <GroupIcon>
                {iconName ?
                    <GoogleIcon iconName={iconName} fw={500} />
                :   icon}
                {title}
            </GroupIcon>
        </TableTd>
        <TableTd pr={0} fw={boldFont ? 700 : undefined}>
            {value}
        </TableTd>
    </TableTr>
);

interface RentDetailsListProps {
    rentHistory: RentHistory;
    memberId: string;
}

export function RentDetailsList({
    rentHistory: {
        adjustments: expenses,
        status,
        rent,
        electricity,
        wifi,
        totalCharges,
        amountPaid,
        outstanding,
        note
    },
    memberId
}: RentDetailsListProps) {
    const hasExpenses = !!expenses?.length;
    const expensesTotal = hasExpenses ? expenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;

    return (
        <Table layout='fixed' verticalSpacing='sm'>
            <TableTbody>
                <TableRow title='Rent' value={toIndianLocale(rent)} iconName='universal_currency_alt' />
                <TableRow title='Electricity' value={toIndianLocale(electricity)} iconName='lightbulb' />
                <TableRow title='WiFi' value={toIndianLocale(wifi)} iconName='wifi' />

                {hasExpenses && (
                    <>
                        <TableRow
                            title='Expenses'
                            value={toIndianLocale(expensesTotal)}
                            iconName='universal_currency_alt'
                            withBorder={false}
                        />
                        <TableTr>
                            <TableTd colSpan={2} px={0} pt={0}>
                                <List spacing='xs' size='sm' listStyleType='none' px={0} pb='xs'>
                                    {expenses.map((expense, index) => (
                                        // eslint-disable-next-line @eslint-react/no-array-index-key
                                        <ListItem key={'expense_' + memberId + index}>
                                            <Badge size='sm' color='red' component='span' mr={8}>
                                                {toIndianLocale(expense.amount)}
                                            </Badge>
                                            {expense.description}
                                        </ListItem>
                                    ))}
                                </List>
                            </TableTd>
                        </TableTr>
                    </>
                )}

                <TableRow title='Total Charges' value={toIndianLocale(totalCharges)} iconName='payments' />
                <TableRow title='Amount Paid' value={toIndianLocale(amountPaid)} iconName='money_bag' />
                <TableRow title='Outstanding' value={toIndianLocale(outstanding)} iconName='currency_rupee' boldFont />

                {!!note && (
                    <>
                        <TableRow title='Note' value={''} iconName='note' withBorder={false} />
                        <TableTr>
                            <Table.Td colSpan={2} px={0} pt={0}>
                                {note}
                            </Table.Td>
                        </TableTr>
                    </>
                )}

                <TableRow
                    title='Status'
                    value={getPaymentStatusTitle(status)}
                    icon={<StatusThemeIcon paymentStatus={status} />}
                />
            </TableTbody>
        </Table>
    );
}
