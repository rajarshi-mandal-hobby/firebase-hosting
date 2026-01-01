import { List, Table } from "@mantine/core";
import type { ReactNode } from "react";
import type { RentHistory } from "../../data/types";
import { type IconComponent, IconUniversalCurrency, IconBulb, IconWifi, IconPayments, IconMoneyBag, IconRupee, IconNote } from "../icons";
import { ICON_SIZE } from "../types";
import { getStatusAlertConfig, StatusBadge } from "../utils";
import { GroupIcon } from "./group-helpers";


interface TableRowProps {
	heading: string;
	value: string;
	Icon: IconComponent | ReactNode;
	withBorder?: boolean;
	boldFont?: boolean;
}

const TableRow = ({ heading, value, Icon, withBorder = true, boldFont = false }: TableRowProps) => (
	<Table.Tr style={withBorder ? undefined : { borderBottom: "none" }}>
		<Table.Th pl={0} fw={500} w={140}>
			<GroupIcon>
				{typeof Icon === "function" ?
					<Icon size={ICON_SIZE} />
				:	Icon}
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

export const RentDetailsList = ({ rentHistory }: RentDetailsListProps) => {
	const expensesTotal =
		rentHistory.expenses.length > 0 ? rentHistory.expenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;
	const statusConfig = getStatusAlertConfig(rentHistory.status);

	return (
		<>
			<Table layout='fixed' verticalSpacing='sm' key={rentHistory.id}>
				<Table.Tbody>
					<TableRow
						heading='Rent'
						value={rentHistory.rent.toIndianLocale()}
						Icon={IconUniversalCurrency}
					/>
					<TableRow
						heading='Electricity'
						value={rentHistory.electricity.toIndianLocale()}
						Icon={IconBulb}
					/>
					<TableRow heading='WiFi' value={rentHistory.wifi.toIndianLocale()} Icon={IconWifi} />

					{rentHistory.expenses.length > 0 && (
						<>
							<TableRow
								heading='Expenses'
								value={expensesTotal.toIndianLocale()}
								Icon={IconUniversalCurrency}
								withBorder={false}
							/>
							<Table.Tr>
								<Table.Td colSpan={2} px={0} pt={0}>
									<List listStyleType='disc' spacing='xs' size='sm'>
										{rentHistory.expenses.map((expense, idx) => (
											<List.Item key={idx + rentHistory.id}>
												{expense.description}: ₹{expense.amount}
											</List.Item>
										))}
									</List>
								</Table.Td>
							</Table.Tr>
						</>
					)}

					<TableRow
						heading='Total Charges'
						value={rentHistory.totalCharges.toIndianLocale()}
						Icon={IconPayments}
					/>
					<TableRow
						heading='Amount Paid'
						value={rentHistory.amountPaid.toIndianLocale()}
						Icon={IconMoneyBag}
					/>
					<TableRow
						heading='Outstanding'
						value={rentHistory.currentOutstanding.toIndianLocale()}
						Icon={IconRupee}
						boldFont
					/>
					<TableRow
						heading='Status'
						value={statusConfig.title}
						Icon={<StatusBadge size={ICON_SIZE} status={rentHistory.status} />}
					/>

					{!!rentHistory.note && (
						<>
							<TableRow heading='Note' value={""} Icon={IconNote} withBorder={false} />
							<Table.Tr>
								<Table.Td colSpan={2} px={0} pt={0}>
									{rentHistory.note}
								</Table.Td>
							</Table.Tr>
						</>
					)}
				</Table.Tbody>
			</Table>
		</>
	);
};
