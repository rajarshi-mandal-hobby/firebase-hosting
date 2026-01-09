import { Stack, Text, Alert, Modal, Button, Divider, Title, TextInput, Paper, Collapse, Group } from "@mantine/core";
import { StatusBadge } from "../../../../../shared/utils";
import { NumberInputWithCurrency } from "../../../../../shared/components/NumberInputWithCurrency";
import {
	GroupSpaceApart,
	GroupIcon,
	MyLoadingOverlay,
	FormClearButton,
	GroupButtons
} from "../../../../../shared/components";
import { useRecordPaymentModal } from "./hooks/useRecordPaymentModal";
import {
	IconExclamation,
	IconMoneyBag,
	IconPayments,
	IconRupee,
	IconUniversalCurrency
} from "../../../../../shared/icons";
import { ICON_SIZE } from "../../../../../data/types/constants";
import type { ModalActions } from "../../hooks/useRentManagement";

export interface RecordPaymentModalProps {
	opened: boolean;
	onClose: () => void;
	onModalError: (id: string) => void;
	onModalSuccess: (id: string) => void;
	modalActions: ModalActions;
}

export const RecordPaymentModal = (props: RecordPaymentModalProps) => {
	const {
		form,
		status,
		statusColor,
		statusTitle,
		convertedAmount,
		newOutstanding,
		isPaymentBelowOutstanding,
		hasError,
		actions
	} = useRecordPaymentModal(props);

	const { selectedMember, isModalWorking, workingMemberName } = props.modalActions;
	const { opened, onClose } = props;

	const memberName = selectedMember?.name || "";
	const { totalCharges, amountPaid, note, currentOutstanding } = selectedMember?.currentMonthRent || {
		totalCharges: 0,
		amountPaid: 0,
		note: "",
		currentOutstanding: 0
	};

	console.log("🎨 Rendering RecordPaymentModal", workingMemberName);

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			onExitTransitionEnd={actions.handleModalExitTransitionEnd}
			title='Record Payment for:'
			pos='relative'>
			{selectedMember && (
				<>
					<MyLoadingOverlay visible={isModalWorking} message={`Saving payment for ${workingMemberName || memberName}...`} />

					<form onSubmit={form.onSubmit(actions.handleRecordPayment)}>
						<Stack gap='lg'>
							<Title order={4}>{memberName}</Title>

							<Collapse in={hasError}>
								<Alert color='red' p='xs' variant='outline' icon={<IconExclamation size={ICON_SIZE} />}>
									<Group wrap="nowrap" grow preventGrowOverflow={false}>
										<Text >Failed to save expenses. You can try again or reset the form to undo changes.</Text>
										<Button size='xs' onClick={actions.resetForm} w={110}>
											Reset
										</Button>
									</Group>
								</Alert>
							</Collapse>

							<Stack gap='xs'>
								<NumberInputWithCurrency
									label='Amount'
									list={"amount-suggestions"}
									rightSection={<FormClearButton field='amountPaid' form={form} />}
									required
									hideControls
									w={150}
									key={form.key("amountPaid")}
									{...form.getInputProps("amountPaid")}
								/>
								<datalist id='amount-suggestions'>
									<option value={totalCharges.toIndianLocale()}>Outstanding Amount</option>
									{amountPaid > 0 && (
										<>
											<option value={amountPaid.toIndianLocale()}>Paid Amount</option>
											<option value={(0).toIndianLocale()}>Remove Payment</option>
										</>
									)}
								</datalist>

								<TextInput
									label='Note'
									placeholder='Optional note...'
									required={isPaymentBelowOutstanding}
									list='payment-note-suggestions'
									rightSection={<FormClearButton field='note' form={form} />}
									key={form.key("note")}
									{...form.getInputProps("note")}
								/>
								<datalist id='payment-note-suggestions'>
									{!!note && <option value={note}>Previous Note</option>}
									{isPaymentBelowOutstanding && (
										<option value='Partial payment received.'>Partial Note</option>
									)}
								</datalist>
							</Stack>

							<Alert color={statusColor} title={`${statusTitle}`}>
								<Stack gap={"xs"}>
									<GroupSpaceApart>
										<GroupIcon>
											<IconPayments size={ICON_SIZE} />
											<Text>Total charges</Text>
										</GroupIcon>
										<Text fw={500}>{totalCharges.toIndianLocale()}</Text>
									</GroupSpaceApart>

									<GroupSpaceApart>
										<GroupIcon>
											<IconMoneyBag size={ICON_SIZE} />
											<Text>Previously paid</Text>
										</GroupIcon>
										<Text fw={500}>{amountPaid.toIndianLocale()}</Text>
									</GroupSpaceApart>

									<GroupSpaceApart>
										<GroupIcon>
											<IconRupee size={ICON_SIZE} />
											<Text>Current outstanding</Text>
										</GroupIcon>
										<Text fw={500}>{currentOutstanding.toIndianLocale()}</Text>
									</GroupSpaceApart>

									<Divider color={statusColor} />

									{/* New Payment Being Added */}
									<GroupSpaceApart>
										<GroupIcon>
											<IconUniversalCurrency size={ICON_SIZE} />
											<Text>This payment</Text>
										</GroupIcon>
										<Text fw={700}>{convertedAmount.toIndianLocale()}</Text>
									</GroupSpaceApart>

									<GroupSpaceApart>
										<GroupIcon>
											<IconRupee size={ICON_SIZE} />
											<Text>New outstanding</Text>
										</GroupIcon>
										<Text fw={700} c={statusColor}>
											{newOutstanding.toIndianLocale()}
										</Text>
									</GroupSpaceApart>

									<Paper p='xs'>
										<Text size='xs'>
											<strong>Note:</strong>
											<br />
											- If payment is less than total charges, a note is required.
											<br />- Set amount to <strong>0</strong> to remove a payment. Any previous note will be
											removed.
										</Text>
									</Paper>
								</Stack>
							</Alert>

							<GroupButtons>
								<Button variant='transparent' onClick={onClose}>
									Cancel
								</Button>
								<Button
									disabled={isModalWorking || !form.isValid() || !form.isDirty()}
									type='submit'
									leftSection={<StatusBadge size={16} status={status} />}>
									Record {convertedAmount.toIndianLocale()}
								</Button>
							</GroupButtons>
						</Stack>
					</form>
				</>
			)}
		</Modal>
	);
};
