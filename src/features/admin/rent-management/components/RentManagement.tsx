import { Title, Accordion, Center, Group, Stack, Menu, ActionIcon, Text, Progress, Grid } from "@mantine/core";
import {
	LoadingBox,
	NothingToShow,
	ErrorContainer,
	GroupIcon,
	MyAvatar,
	RentDetailsList
} from "../../../../shared/components";
import {
	IconMoreVertical,
	IconWhatsapp,
	IconShare,
	IconUniversalCurrency,
	IconMoneyBag
} from "../../../../shared/icons";
import { StatusBadge, formatNumberIndianLocale } from "../../../../shared/utils";
import { useRentManagement } from "../hooks/useRentManagement";
import { AddExpenseModal } from "./modals/AddExpenseModal";
import { RecordPaymentModal } from "./modals/RecordPaymentModal";

export const RentManagement = () => {
	const { members, selectedMember, isLoading, derivedRents, error, actions, modalActions } = useRentManagement();

	if (isLoading) {
		return <LoadingBox />;
	}

	if (error) {
		if (error instanceof Error && error.message === "No members found") {
			return <NothingToShow message='Why not add a member?' />;
		}
		return <ErrorContainer error={error} onRetry={actions.handleRefetch} />;
	}

	if (members && !isLoading && !error) {
		return (
			<>
				<Stack my='md' gap={0}>
					<GroupIcon>
						<StatusBadge status={derivedRents.totalOutstanding > 0 ? "Due" : "Paid"} size={16} />
						<Title order={4} c='dimmed' fw={300}>
							Total Rent: {derivedRents.totalRent.toIndianLocale()}
						</Title>
					</GroupIcon>
					<Progress.Root size='xl'>
						<Progress.Section value={derivedRents.totalPaidPercentage} color='gray.4'>
							<Progress.Label c='gray.7'>{derivedRents.totalPaid.toIndianLocale()}</Progress.Label>
						</Progress.Section>
						<Progress.Section value={derivedRents.totalOutstandingPercentage} color='red'>
							<Progress.Label c='red.1'>{derivedRents.totalOutstanding.toIndianLocale()}</Progress.Label>
						</Progress.Section>
					</Progress.Root>
				</Stack>

				<Accordion>
					{members.map((member) => {
						return (
							<Accordion.Item key={member.id} value={member.id}>
								<Center>
									<Accordion.Control aria-label={member.name}>
										<Group wrap='nowrap' mr='xs'>
											<MyAvatar name={member.name} size='md' />
											<Stack gap={0}>
												<Title order={5} lineClamp={1}>
													{member.name}
												</Title>
												<GroupIcon>
													<Text fw={500}>
														{formatNumberIndianLocale(member.currentMonthRent.currentOutstanding)}
													</Text>
													<StatusBadge status={member.currentMonthRent.status} size={14} />
												</GroupIcon>
											</Stack>
										</Group>
									</Accordion.Control>
									<Menu>
										<Menu.Target>
											<ActionIcon variant='white' autoContrast size={32}>
												<IconMoreVertical size={16} />
											</ActionIcon>
										</Menu.Target>
										<Menu.Dropdown>
											<Menu.Label c='dimmed' fz='sm' tt='full-width'>
												{member.name.split(" ")[0]}
											</Menu.Label>
											<Menu.Divider />
											<Menu.Label>Share Rent</Menu.Label>
											<Menu.Item
												onClick={() => actions.handleShareRent(member, "whatsapp")}
												leftSection={<IconWhatsapp />}>
												WhatsApp
											</Menu.Item>
											<Menu.Item
												onClick={() => actions.handleShareRent(member, "share")}
												leftSection={<IconShare />}>
												Share
											</Menu.Item>
											<Menu.Divider />
											<Menu.Item
												leftSection={<IconUniversalCurrency />}
												onClick={() => {
													modalActions.handleRecordPayment(member);
												}}>
												Record Payment
											</Menu.Item>
											<Menu.Item
												leftSection={<IconMoneyBag />}
												onClick={() => {
													modalActions.handleAddExpense(member);
												}}>
												Add Expense
											</Menu.Item>
										</Menu.Dropdown>
									</Menu>
								</Center>
								<Accordion.Panel>
									<RentDetailsList rentHistory={member.currentMonthRent} />
								</Accordion.Panel>
							</Accordion.Item>
						);
					})}
				</Accordion>

				<RecordPaymentModal
					opened={modalActions.recordPaymentModalOpened}
					onClose={modalActions.closeRecordPayment}
					onExitTransitionEnd={modalActions.handleOnExitTransition}
					memberName={selectedMember?.name || ""}
					outstandingAmount={selectedMember?.currentMonthRent.currentOutstanding || 0}
					totalCharges={selectedMember?.currentMonthRent.totalCharges || 0}
					amountPaid={selectedMember?.currentMonthRent.amountPaid || 0}
					paymentNote={selectedMember?.currentMonthRent.note || ""}
				/>

				<AddExpenseModal
					opened={modalActions.addExpenseModalOpened}
					onClose={modalActions.closeAddExpense}
					onExitTransitionEnd={modalActions.handleOnExitTransition}
					memberName={selectedMember?.name || ""}
					initialExpenses={selectedMember?.currentMonthRent.expenses || []}
				/>
			</>
		);
	}

	// For empty state
	return <NothingToShow message='No members found' />;
};
