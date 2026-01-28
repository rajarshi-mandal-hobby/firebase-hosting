import { Stack, Text, Alert, Modal, Button, Divider, Title, TextInput, Paper } from "@mantine/core";
import { toIndianLocale, StatusBadge } from "../../../../../shared/utils";
import { NumberInputWithCurrency } from "../../../../../shared/components/NumberInputWithCurrency";
import {
	GroupSpaceApart,
	GroupIcon,
	MyLoadingOverlay,
	FormClearButton,
	GroupButtons
} from "../../../../../shared/components";
import { useRecordPaymentModal } from "./hooks/useRecordPaymentModal";
import { IconMoneyBag, IconPayments, IconRupee, IconUniversalCurrency } from "../../../../../shared/icons";
import { ICON_SIZE } from "../../../../../data/types/constants";
import type { UseErrorCache } from "../../../tab-navigation/hooks/useErrorCache";
import { AlertOnError } from "../shared/AlertOnError";
import type { ModalActions } from "../../../tab-navigation/hooks/useModalActions";

export interface RecordPaymentModalProps extends UseErrorCache {
	opened: boolean;
	onClose: () => void;
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
		actions,
		hasError
	} = useRecordPaymentModal(props);

	const { selectedMember, isModalWorking, workingMemberName } = props.modalActions;
	const { opened, onClose } = props;
	const { getErrorMemberName, hasModalErrors } = props;

	const memberName = selectedMember?.name || "";
	const { totalCharges, amountPaid, note, currentOutstanding } = selectedMember?.currentMonthRent || {
		totalCharges: 0,
		amountPaid: 0,
		note: "",
		currentOutstanding: 0
	};

	const isButtonDisabled = isModalWorking || !form.isValid() || !form.isDirty() || !selectedMember;

	console.log("🎨 Rendering RecordPaymentModal", selectedMember, workingMemberName);

	return (
		<Modal opened={opened} onClose={onClose} title='Record Payment for:' pos='relative'>
			<>
				<MyLoadingOverlay
					visible={isModalWorking}
					name={`Saving payment for ${workingMemberName || memberName}...`}
				/>

				<form onSubmit={form.onSubmit(actions.handleRecordPayment)}>
					<Stack gap='lg'>
						<Title order={4}>{memberName}</Title>

						<AlertOnError
							hasModalErrors={hasModalErrors()}
							hasErrorForMember={hasError}
							resetCallback={actions.resetForm}
							failedToMessage='record payment'
							memberName={getErrorMemberName()}
						/>

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
								<option value={toIndianLocale(totalCharges)}>Total Charges</option>
								{amountPaid > 0 && (
									<>
										<option value={toIndianLocale(amountPaid)}>Paid Amount</option>
										<option value={toIndianLocale(0)}>Remove Payment</option>
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
								{isPaymentBelowOutstanding && <option value='Partial payment received.'>Partial Note</option>}
							</datalist>
						</Stack>

						<Alert color={statusColor} title={`${statusTitle}`}>
							<Stack gap={"xs"}>
								<GroupSpaceApart>
									<GroupIcon>
										<IconPayments size={ICON_SIZE} />
										<Text>Total charges</Text>
									</GroupIcon>
									<Text fw={500}>{toIndianLocale(totalCharges)}</Text>
								</GroupSpaceApart>

								<GroupSpaceApart>
									<GroupIcon>
										<IconMoneyBag size={ICON_SIZE} />
										<Text>Previously paid</Text>
									</GroupIcon>
									<Text fw={500}>{toIndianLocale(amountPaid)}</Text>
								</GroupSpaceApart>

								<GroupSpaceApart>
									<GroupIcon>
										<IconRupee size={ICON_SIZE} />
										<Text>Current outstanding</Text>
									</GroupIcon>
									<Text fw={500}>{toIndianLocale(currentOutstanding)}</Text>
								</GroupSpaceApart>

								<Divider color={statusColor} />

								{/* New Payment Being Added */}
								<GroupSpaceApart>
									<GroupIcon>
										<IconUniversalCurrency size={ICON_SIZE} />
										<Text>This payment</Text>
									</GroupIcon>
									<Text fw={700}>{toIndianLocale(convertedAmount)}</Text>
								</GroupSpaceApart>

								<GroupSpaceApart>
									<GroupIcon>
										<IconRupee size={ICON_SIZE} />
										<Text>New outstanding</Text>
									</GroupIcon>
									<Text fw={700} c={statusColor}>
										{toIndianLocale(newOutstanding)}
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
								disabled={isButtonDisabled}
								type='submit'
								leftSection={<StatusBadge size={16} status={status} />}>
								Record {toIndianLocale(convertedAmount)}
							</Button>
						</GroupButtons>
					</Stack>
				</form>
			</>
		</Modal>
	);
};
