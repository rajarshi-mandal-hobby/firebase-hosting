import {
	Box,
	Stack,
	Group,
	Divider,
	NumberInput,
	Switch,
	MultiSelect,
	Textarea,
	Text,
	Button,
	SegmentedControl,
	Title,
	ThemeIcon
} from "@mantine/core";
import { NumberInputWithCurrency } from "../../../shared/components/NumberInputWithCurrency";
import type { GenerateBillsData } from "./hooks/useBillsData";
import { useBillsForm } from "./hooks/useBillsForm";
import { IconInfo, IconPerson, IconUniversalCurrency } from "../../../shared/icons";
import { GenerateBillsConfirmModal } from "./GenerateBillsConfirmModal";
import { FormClearButton, GroupIcon, MyLoadingOverlay } from "../../../shared/components";
import type { Floor } from "../../../data/types";

export const GenerateBillsFormContent = ({ billingData }: { billingData: GenerateBillsData }) => {
	const {
		form,
		segmentedControlData,
		derivedState,
		toggleState,
		isFetching,
		memberOptions,
		floorIdNameMap,
		actions: { handleFormSubmit, toggleFloorExpense },
		modalActions
	} = useBillsForm(billingData);

	console.log("🎨 Rendering GenerateBillsFormContent");

	return (
		<>
			<Box pos='relative'>
				<MyLoadingOverlay visible={isFetching} />
				<form onSubmit={form.onSubmit(handleFormSubmit)}>
					<Stack gap='lg'>
						<SegmentedControl
							data={segmentedControlData}
							value={form.values.selectedBillingMonth}
							key={form.key("selectedBillingMonth")}
							{...form.getInputProps("selectedBillingMonth")}
						/>

						<GroupIcon my='md'>
							<IconInfo size={20} color={form.values.isUpdatingBills ? "orange" : "green.9"} />
							<Title order={5}>
								{form.values.isUpdatingBills ? "Updating previous bills" : "Generating new bills"}
							</Title>
						</GroupIcon>

						<Divider label='Electricity Charges' />

						<Stack gap='xs'>
							<Group align='flex-start' justify='flex-start'>
								<NumberInputWithCurrency
									required
									label='2nd Floor'
									placeholder='1400'
									flex={2}
									inputWrapperOrder={["label", "input", "description", "error"]}
									rightSection={<FormClearButton field='secondFloorElectricityBill' form={form} />}
									key={form.key("secondFloorElectricityBill")}
									{...form.getInputProps("secondFloorElectricityBill")}
								/>
								<NumberInput
									required
									label='Members'
									placeholder='7'
									flex={1}
									allowNegative={false}
									hideControls
									key={form.key("activeMemberCounts.2nd")}
									{...form.getInputProps("activeMemberCounts.2nd")}
								/>
							</Group>

							<DisplayMembersByFloor
								floor='2nd'
								activeMemberIdsByFloor={floorIdNameMap}
								billPerMember={derivedState.floorBills["2nd"]}
							/>
						</Stack>

						<Stack gap='xs'>
							<Group align='flex-start' justify='flex-start'>
								<NumberInputWithCurrency
									required
									label='3rd Floor'
									placeholder='1200'
									flex={2}
									allowNegative={false}
									hideControls
									rightSection={<FormClearButton field='thirdFloorElectricityBill' form={form} />}
									key={form.key("thirdFloorElectricityBill")}
									{...form.getInputProps("thirdFloorElectricityBill")}
								/>
								<NumberInput
									required
									label='Members'
									placeholder='6'
									flex={1}
									allowNegative={false}
									hideControls
									key={form.key("activeMemberCounts.3rd")}
									{...form.getInputProps("activeMemberCounts.3rd")}
								/>
							</Group>

							<DisplayMembersByFloor
								floor='3rd'
								activeMemberIdsByFloor={floorIdNameMap}
								billPerMember={derivedState.floorBills["3rd"]}
							/>
						</Stack>

						<Divider label='WiFi Charges' mt='lg' />

						<Stack gap='xs'>
							<Group align='flex-start' justify='center'>
								<MultiSelect
									required={!!form.values.wifiCharges.wifiMonthlyCharge}
									label='Members'
									data={memberOptions}
									placeholder={!form.values.wifiCharges.wifiMemberIds.length ? "Select members" : undefined}
									flex={2}
									key={form.key("wifiCharges.wifiMemberIds")}
									{...form.getInputProps("wifiCharges.wifiMemberIds")}
								/>

								<NumberInputWithCurrency
									required={!!form.values.wifiCharges.wifiMemberIds.length}
									label='Amount'
									placeholder='600'
									flex={1}
									step={50}
									hideControls
									allowNegative={false}
									key={form.key("wifiCharges.wifiMonthlyCharge")}
									{...form.getInputProps("wifiCharges.wifiMonthlyCharge")}
								/>
							</Group>
							<DisplayChargesPerHead chargesPerHead={derivedState.wifiChargesPerHead} />
						</Stack>

						<Divider label='Additional Charges' mt='lg' />

						<Switch
							label={`Select all ${form.values.activeMemberCounts["2nd"]} members on 2nd floor`}
							checked={toggleState["2nd"]}
							onChange={(event) => toggleFloorExpense("2nd", event.currentTarget.checked)}
						/>
						<Switch
							label={`Select all ${form.values.activeMemberCounts["3rd"]} members on 3rd floor`}
							checked={toggleState["3rd"]}
							onChange={(event) => toggleFloorExpense("3rd", event.currentTarget.checked)}
						/>

						<Stack gap='xs'>
							<Group align='flex-start' justify='center'>
								<MultiSelect
									required={!!form.values.additionalExpenses.addExpenseAmount}
									label='Members'
									data={memberOptions}
									placeholder={
										!form.values.additionalExpenses.addExpenseMemberIds.length ? "Select members" : undefined
									}
									flex={2}
									key={form.key("additionalExpenses.addExpenseMemberIds")}
									{...form.getInputProps("additionalExpenses.addExpenseMemberIds")}
								/>
								<NumberInputWithCurrency
									required={!!form.values.additionalExpenses.addExpenseMemberIds.length}
									label='Amount'
									placeholder='100'
									allowNegative={true}
									hideControls
									flex={1}
									key={form.key("additionalExpenses.addExpenseAmount")}
									{...form.getInputProps("additionalExpenses.addExpenseAmount")}
								/>
							</Group>
							<DisplayChargesPerHead chargesPerHead={derivedState.additionalChargesPerHead} />
						</Stack>

						<Textarea
							required={
								!!form.values.additionalExpenses.addExpenseMemberIds.length ||
								!!form.values.additionalExpenses.addExpenseAmount
							}
							label='Description'
							placeholder='Enter expense description'
							disabled={
								!form.values.additionalExpenses.addExpenseMemberIds.length &&
								!form.values.additionalExpenses.addExpenseAmount
							}
							autosize
							minRows={1}
							rightSection={<FormClearButton field='additionalExpenses.addExpenseDescription' form={form} />}
							rightSectionPointerEvents='auto'
							key={form.key("additionalExpenses.addExpenseDescription")}
							{...form.getInputProps("additionalExpenses.addExpenseDescription")}
						/>

						<Group justify='flex-end' align='center' mt='xl'>
							<Group justify='flex-end'>
								<Button variant='default' disabled={!form.isDirty()} onClick={form.reset}>
									Reset
								</Button>
								<Button type='submit' disabled={!form.isDirty() || isFetching}>
									{form.values.isUpdatingBills ? "Update" : "Generate"}
								</Button>
							</Group>
						</Group>
					</Stack>
				</form>
			</Box>

			{/* Confirmation modal */}
			<GenerateBillsConfirmModal
				opened={modalActions.confirmModalOpened}
				close={modalActions.closeConfirmModal}
				formData={modalActions.submittedFormData}
				onConfirm={modalActions.handleConfirm}
			/>
		</>
	);
};

interface GroupIconProps {
	children: React.ReactNode;
	Icon: any;
}

function DisplayIcons({ children, Icon }: GroupIconProps) {
	const sizeThemeIcon = 20;
	const iconSize = sizeThemeIcon - 6;
	return (
		<GroupIcon>
			<ThemeIcon size={sizeThemeIcon} variant='filled' color='violet.0'>
				<Icon size={iconSize} color='violet.9' />
			</ThemeIcon>
			{children}
		</GroupIcon>
	);
}

interface DisplayMemberByFloorProps {
	floor: Floor;
	activeMemberIdsByFloor: Record<Floor, Record<string, string>>;
	billPerMember: number;
}

function DisplayMembersByFloor({ floor, activeMemberIdsByFloor, billPerMember }: DisplayMemberByFloorProps) {
	return (
		<DisplayIcons Icon={IconPerson}>
			<Text fz='xs' c='dimmed'>
				{Object.values(activeMemberIdsByFloor[floor])
					.map((name) => name.split(" ")[0])
					.join(", ")}
				{" — "}
				<span style={{ fontWeight: 700 }}>{billPerMember.toIndianLocale() + "/member"}</span>
			</Text>
		</DisplayIcons>
	);
}

interface DisplayChargesPerHeadProps {
	chargesPerHead: number;
}

function DisplayChargesPerHead({ chargesPerHead }: DisplayChargesPerHeadProps) {
	return (
		<DisplayIcons Icon={IconUniversalCurrency}>
			<Text fz='xs' fw={700} c='dimmed'>
				{chargesPerHead.toIndianLocale()}/member
			</Text>
		</DisplayIcons>
	);
}
