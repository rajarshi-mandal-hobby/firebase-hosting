import {
	Modal,
	Stack,
	Title,
	Paper,
	Textarea,
	Group,
	ActionIcon,
	CloseIcon,
	Alert,
	Button,
	Text,
	Divider,
	Collapse
} from "@mantine/core";
import { type Expense } from "../../../../../data/types";
import {
	GroupButtons,
	GroupIcon,
	GroupSpaceApart,
	MyLoadingOverlay,
	NumberInputWithCurrency
} from "../../../../../shared/components";
import { IconUndo, IconAdd, IconUniversalCurrency } from "../../../../../shared/icons";
import { formatNumberWithOrdinal } from "../../../../../shared/utils";
import { useAddExpenseModal } from "./hooks/useAddExpenseModal";

import type { UseErrorCache } from "../../../tab-navigation/hooks/useErrorCache";
import { AlertOnError } from "../shared/AlertOnError";
import type { ModalActions } from "../../../tab-navigation/hooks/useModalActions";

export interface AddExpenseModalProps extends UseErrorCache, ModalActions {
	opened: boolean;
	onClose: () => void;
	memberId: string;
	memberName: string;
	previousExpenses: Expense[];
}

export const AddExpenseModal = (props: AddExpenseModalProps) => {
	const {
		form,
		currentExpenses,
		previousExpensesCache,
		totalAmount,
		removedCount,
		refreshKey,
		isRemovedOrModified,
		isRemoved,
		hasError,
		hasPreviousExpenses,
		actions
	} = useAddExpenseModal(props);
	const { opened, onClose, memberName, isModalWorking, hasModalErrors } = props;
	const { getErrorMemberName } = props;

	console.log("🎨 Rendering AddExpenseModal");

	return (
		<Modal opened={opened} onClose={onClose} title='Add Expense for:' centered pos='relative'>
			<MyLoadingOverlay
				visible={isModalWorking}
				name={
					isRemovedOrModified ?
						`Updating expense(s) for ${memberName.split(" ")[0]}`
						: `Adding expense(s) for ${memberName.split(" ")[0]}`
				}
			/>

			<form onSubmit={form.onSubmit(actions.handleOnSubmit)}>
				<Stack gap='lg'>
					<Title order={4}>{memberName}</Title>

					<AlertOnError
						hasModalErrors={hasModalErrors}
						hasErrorForMember={hasError}
						resetCallback={actions.resetForm}
						failedToMessage='add expenses'
						memberName={getErrorMemberName()}
					/>

					{/* Expenses List */}
					{currentExpenses.map((expense, index) => (
						<Stack gap='xs' key={index + "expense" + refreshKey} mb='sm'>
							<Divider label={formatNumberWithOrdinal(index + 1) + " Expense"} />
							{/* Description Input */}
							<Textarea
								autoCapitalize='sentences'
								label={formatNumberWithOrdinal(index + 1) + " Description"}
								placeholder='Repair, Maintenance...'
								minRows={1}
								flex={2}
								autosize
								required={!isRemoved}
								key={form.key(`expenses.${index}.description`)}
								{...form.getInputProps(`expenses.${index}.description`)}
							/>

							{/* Amount Input & Actions */}
							<GroupSpaceApart>
								<NumberInputWithCurrency
									w={150}
									label='Amount'
									placeholder='Amount'
									hideControls
									required={!isRemoved}
									allowNegative
									allowDecimal={false}
									key={form.key(`expenses.${index}.amount`)}
									{...form.getInputProps(`expenses.${index}.amount`)}
								/>

								{/* Action Buttons */}
								<Group mt={28} wrap='nowrap'>
									{/* Reset Button */}
									{previousExpensesCache[index] && (
										<ActionIcon
											aria-label='Reset Expense'
											variant='default'
											disabled={
												!(
													previousExpensesCache[index].description !== expense.description ||
													previousExpensesCache[index].amount !== expense.amount
												)
											}
											size={30}
											onClick={() => actions.resetExpenses(index)}>
											<IconUndo size={16} />
										</ActionIcon>
									)}

									{/* Remove Button */}
									<ActionIcon
										aria-label='Remove Expense'
										color='red'
										variant='light'
										onClick={() => actions.removeExpenseItem(index)}
										disabled={index === 0 && expense.description === "" && expense.amount === ""}
										size={30}>
										<CloseIcon size='16' />
									</ActionIcon>

									{/* Add Button */}
									<ActionIcon
										aria-label='Add Expense'
										onClick={actions.addExpenseItem}
										disabled={actions.isLastExpenseEntry(expense, index)}
										size={30}>
										<IconAdd size={16} />
									</ActionIcon>
								</Group>
							</GroupSpaceApart>
						</Stack>
					))}

					{/* Summary Alert */}
					<Alert color='orange' title='Expense Summary'>
						<GroupIcon>
							<IconUniversalCurrency size={16} />
							<Text>Total Amount:</Text>
							<Text fw={500}>{totalAmount.toIndianLocale()}</Text>
						</GroupIcon>

						{/* Check if initialExpenses are removed */}
						<Collapse in={isRemoved}>
							<Paper p='xs' mt='sm'>
								<GroupIcon>
									<Text size='xs'>
										<span style={{ fontWeight: 700, color: "red" }}>Warning!</span> You are about to remove{" "}
										{removedCount} existing expense
										{removedCount > 1 ? "s" : ""}.
									</Text>
									<Button size='xs' onClick={() => actions.resetRemoved()} w={100}>
										Reset
									</Button>
								</GroupIcon>
							</Paper>
						</Collapse>
					</Alert>

					{/* Footer Actions */}
					<GroupButtons>
						<Button variant='transparent' onClick={onClose}>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={
								isModalWorking || !form.isDirty() || !isRemovedOrModified || !form.isValid() || !memberName
							}>
							{hasPreviousExpenses && isRemovedOrModified ? "Update Expenses" : "Add expenses"}
						</Button>
					</GroupButtons>
				</Stack>
			</form>
		</Modal>
	);
};
