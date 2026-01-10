import { Accordion, Progress, Stack, Title, Center, Group, Menu, ActionIcon, Text } from "@mantine/core";
import { useMembers } from "../../../../data/services/membersService";
import { ACTION_BUTTON_SIZE, ACTION_ICON_SIZE, ICON_SIZE, type Member } from "../../../../data/types";
import {
	GroupIcon,
	MyAvatar,
	RentDetailsList,
	LoadingBox,
	NothingToShow,
	ErrorContainer
} from "../../../../shared/components";
import {
	IconMoreVertical,
	IconWhatsapp,
	IconShare,
	IconUniversalCurrency,
	IconMoneyBag,
	IconExclamation
} from "../../../../shared/icons";
import { StatusBadge } from "../../../../shared/utils";
import { useRentManagement } from "../hooks/useRentManagement";
import { RecordPaymentModal } from "./modals/RecordPaymentModal";
import type { ModalErrorProps, ModalType } from "../tab-navigation/hooks/useTabNavigation";

interface RentManagementContentProps {
	members: Member[];
	onModalError: <T>(props: ModalErrorProps<T>) => void;
	hasModalErrorForMember: (memberId: string, type?: ModalType) => boolean;
}

interface DisplayPriorityIconProps {
	hasFailures: boolean;
}
const DisplayPriorityIcon = ({ hasFailures }: DisplayPriorityIconProps) => {
	return hasFailures ? <IconExclamation size={ICON_SIZE} color='red' /> : null;
};

const RentManagementContent = ({ members, onModalError, hasModalErrorForMember }: RentManagementContentProps) => {
	const {
		recordPaymentModal: { recordPaymentModalOpened, openRecordPayment, closeRecordPayment },
		addExpenseModal: { addExpenseModalOpened, openAddExpense, closeAddExpense },
		derivedRents,
		handleShareRent,
		modalActions
	} = useRentManagement({ members });

	console.log("🎨 Rendering RentManagementContent");

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
					{/* <Progress.Section value={derivedRents.totalPartialPercentage} color='orange'>
						<Progress.Label c='orange.1'>{derivedRents.totalPartial.toIndianLocale()}</Progress.Label>
					</Progress.Section> */}
					<Progress.Section value={derivedRents.totalOutstandingPercentage + derivedRents.totalPartialPercentage} color='red'>
						<Progress.Label c='red.1'>{(derivedRents.totalOutstanding + derivedRents.totalPartial).toIndianLocale()}</Progress.Label>
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
												<Text fw={500}>{member.currentMonthRent.currentOutstanding.toIndianLocale()}</Text>
												<StatusBadge status={member.currentMonthRent.status} size={14} />
											</GroupIcon>
										</Stack>
									</Group>
								</Accordion.Control>
								<Menu>
									<Menu.Target>
										<ActionIcon
											variant='white'
											autoContrast
											size={ACTION_BUTTON_SIZE}
											bdrs={"0 var(--mantine-radius-md) var(--mantine-radius-md) 0"}
											c={hasModalErrorForMember(member.id) ? "red" : "var(--mantine-color-bright)"}>
											<IconMoreVertical size={ACTION_ICON_SIZE} />
										</ActionIcon>
									</Menu.Target>
									<Menu.Dropdown>
										<Menu.Label c='dimmed' fz='sm' tt='full-width'>
											{member.name.split(" ")[0]}
										</Menu.Label>
										<Menu.Divider />
										<Menu.Label>Share Rent</Menu.Label>
										<Menu.Item
											onClick={() => handleShareRent(member, "whatsapp")}
											leftSection={<IconWhatsapp size={ICON_SIZE} />}>
											WhatsApp
										</Menu.Item>
										<Menu.Item
											onClick={() => handleShareRent(member, "share")}
											leftSection={<IconShare size={ICON_SIZE} />}>
											Share
										</Menu.Item>
										<Menu.Divider />
										<Menu.Item
											leftSection={<IconUniversalCurrency size={ICON_SIZE} />}
											rightSection={
												<DisplayPriorityIcon
													hasFailures={hasModalErrorForMember(member.id, "recordPayment")}
												/>
											}
											onClick={() => modalActions.handleModalOpen(member, openRecordPayment)}>
											Record Payment
										</Menu.Item>
										<Menu.Item
											leftSection={<IconMoneyBag size={ICON_SIZE} />}
											rightSection={
												<DisplayPriorityIcon
													hasFailures={hasModalErrorForMember(member.id, "addExpense")}
												/>
											}
											onClick={() => modalActions.handleModalOpen(member, openAddExpense)}>
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
				opened={recordPaymentModalOpened}
				onClose={closeRecordPayment}
				// onModalError={(id) => onModalError({ isError: true, type: "recordPayment", memberId: id })}
				// onModalSuccess={(id) => onModalError({ isError: false, type: "recordPayment", memberId: id })}
				onModalError={onModalError}
				modalActions={modalActions}
			/>

			{/* <AddExpenseModal
				opened={addExpenseModalOpened}
				onClose={closeAddExpense}
				onExitTransitionEnd={handleExitTransitionEnd}
				onModalWorking={handleModalWork}
				onError={(id) => addFailure("addExpense", id)}
				onSuccess={(id) => removeFailure("addExpense", id)}
				memberName={selectedMember?.name || ""}
				memberId={selectedMember?.id || ""}
				previousExpenses={selectedMember?.currentMonthRent.expenses || [{ amount: 0, description: "" }]}
			/> */}
		</>
	);
};

interface RentManagementProps {
	hasModalErrorForMember: (memberId: string, type?: ModalType) => boolean;
	onModalError: <T>(props: ModalErrorProps<T>) => void;
}

export function RentManagement({ hasModalErrorForMember, onModalError }: RentManagementProps) {
	// const { members, isLoading, error, derivedRents, actions } = useRentManagement();
	// Active members only
	const { members, isLoading, error, refresh } = useMembers("active");

	console.log("🎨 Rendering RentManagement");

	if (isLoading) {
		return <LoadingBox />;
	}

	if (error) {
		return <ErrorContainer error={error} onRetry={refresh} />;
	}

	if (members.length) {
		return <RentManagementContent members={members} onModalError={onModalError} hasModalErrorForMember={hasModalErrorForMember} />;
	} else {
		// For empty state
		return <NothingToShow message='No members found. Why not add one first?' />;
	}
}
