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
import { ICON_SIZE, type Expense } from "../../../../../data/types";
import {
	GroupIcon,
	GroupSpaceApart,
	MyLoadingOverlay,
	NumberInputWithCurrency
} from "../../../../../shared/components";
import { IconUndo, IconAdd, IconUniversalCurrency, IconExclamation } from "../../../../../shared/icons";
import { formatNumberWithOrdinal } from "../../../../../shared/utils";
import { useAddExpenseModal } from "./hooks/useAddExpenseModal";

interface AddExpenseModalProps {
	opened: boolean;
	memberId: string;
	memberName: string;
	previousExpenses: Expense[];
	onModalWorking: (working: boolean) => void;
	onClose: () => void;
	onExitTransitionEnd: () => void;
	onError: (memberId: string) => void;
	onSuccess: (memberId: string) => void;
}

export const AddExpenseModal = ({
	opened,
	memberName,
	memberId,
	previousExpenses,
	onModalWorking,
	onClose,
	onExitTransitionEnd,
	onError,
	onSuccess
}: AddExpenseModalProps) => {
	const {
		form,
		currentExpenses,
		previousExpensesCache,
		totalAmount,
		removedCount,
		refreshKey,
		isSaving,
		isRemovedOrModified,
		isRemoved,
		hasError,
		hasPreviousExpenses,
		actions
	} = useAddExpenseModal({
		opened,
		memberId,
		memberName,
		previousExpenses,
		onModalWorking,
		onClose,
		onError,
		onSuccess
	});

	console.log("🎨 Rendering AddExpenseModal");

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Add Expense for:'
			centered
			pos='relative'
			onExitTransitionEnd={onExitTransitionEnd}>
			<MyLoadingOverlay
				visible={isSaving}
				message={
					isRemovedOrModified ?
						`Updating expense(s) for ${memberName.split(" ")[0]}`
					:	`Adding expense(s) for ${memberName.split(" ")[0]}`
				}
			/>
			{memberId && (
				<form onSubmit={form.onSubmit(actions.handleOnSubmit)}>
					<Stack gap='lg'>
						<Title order={4}>{memberName}</Title>

						<Collapse in={hasError}>
							<Alert color='red' p='xs' variant='outline' icon={<IconExclamation size={ICON_SIZE} />}>
								<GroupIcon>
									<Text>Failed to save expenses. You can try again or reset the form to undo changes.</Text>
									<Button size='xs' onClick={actions.resetForm} w={110}>
										Reset
									</Button>
								</GroupIcon>
							</Alert>
						</Collapse>

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
						<Group justify='flex-end' mt='xl'>
							<Button variant='transparent' onClick={onClose}>
								Cancel
							</Button>
							<Button
								type='submit'
								loading={isSaving}
								disabled={isSaving || !form.isDirty() || !isRemovedOrModified}>
								{hasPreviousExpenses && isRemovedOrModified ? "Update Expenses" : "Add expenses"}
							</Button>
						</Group>
					</Stack>
				</form>
			)}
		</Modal>
	);
};
