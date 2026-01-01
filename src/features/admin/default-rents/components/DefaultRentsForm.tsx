import { Button, Group, SimpleGrid, Stack, TextInput, Box, Space, Divider } from "@mantine/core";
import { FormClearButton, GroupSpaceApart, NumberInputWithCurrency } from "../../../../shared/components/index.ts";
import { MyLoadingOverlay } from "../../../../shared/components/index.ts";
import { useDefaultRentsForm } from "../hooks/useDefaultRentsForm.ts";
import type { DefaultValues } from "../../../../data/types/index.ts";

type DefaultRentsFormProps = {
	values: DefaultValues | null;
	onRefresh: () => void;
};

export const DefaultRentsForm = ({ values, onRefresh }: DefaultRentsFormProps) => {
	const { form, isSaving, handleSave } = useDefaultRentsForm(values, onRefresh);

	console.log("🎨 Rendering DefaultRentsForm");

	return (
		<Box pos='relative'>
			<MyLoadingOverlay visible={isSaving} />

			<form onSubmit={form.onSubmit(handleSave)}>
				<Stack gap='lg'>
					<Divider label='2nd Floor Rents' />
					<SimpleGrid cols={2} spacing='md'>
						<NumberInputWithCurrency
							label='Bed Rent'
							description={form.errors["secondBed"] ? null : "Minimum ₹1600"}
							required
							inputWrapperOrder={["label", "input", "description", "error"]}
							key={form.key("secondBed")}
							{...form.getInputProps("secondBed")}
						/>
						<NumberInputWithCurrency
							label='Room Rent'
							description={form.errors["secondRoom"] ? null : "Double the Bed Rent"}
							required
							inputWrapperOrder={["label", "input", "description", "error"]}
							key={form.key("secondRoom")}
							{...form.getInputProps("secondRoom")}
						/>
						<NumberInputWithCurrency
							label='Special Rent'
							description={form.errors["secondSpecial"] ? null : "Greater than Bed Rent"}
							required
							inputWrapperOrder={["label", "input", "description", "error"]}
							key={form.key("secondSpecial")}
							{...form.getInputProps("secondSpecial")}
						/>
					</SimpleGrid>

					<Space h='xs' />

					<Divider label='3rd Floor Rents' />
					<SimpleGrid cols={2} spacing='md'>
						<NumberInputWithCurrency
							label='Bed Rent'
							description={form.errors["thirdBed"] ? null : "Minimum ₹1600"}
							required
							inputWrapperOrder={["label", "input", "description", "error"]}
							key={form.key("thirdBed")}
							{...form.getInputProps("thirdBed")}
						/>
						<NumberInputWithCurrency
							label='Room Rent'
							description={form.errors["thirdRoom"] ? null : "Double the Bed Rent"}
							required
							inputWrapperOrder={["label", "input", "description", "error"]}
							key={form.key("thirdRoom")}
							{...form.getInputProps("thirdRoom")}
						/>
					</SimpleGrid>

					<Space h='xs' />

					<Divider label='General Charges' />
					<SimpleGrid cols={2} spacing='md'>
						<NumberInputWithCurrency
							label='Security Deposit'
							description={form.errors["securityDeposit"] ? null : "Minimum ₹1000"}
							required
							inputWrapperOrder={["label", "input", "description", "error"]}
							key={form.key("securityDeposit")}
							{...form.getInputProps("securityDeposit")}
						/>
						<NumberInputWithCurrency
							label='WiFi Monthly Charge'
							description={form.errors["wifiMonthlyCharge"] ? null : "Minimum ₹100"}
							required
							inputWrapperOrder={["label", "input", "description", "error"]}
							key={form.key("wifiMonthlyCharge")}
							{...form.getInputProps("wifiMonthlyCharge")}
						/>
						<TextInput
							label='UPI VPA'
							description={form.errors["upiVpa"] ? null : "name@bank"}
							inputWrapperOrder={["label", "input", "description", "error"]}
							rightSection={<FormClearButton form={form} field='upiVpa' />}
							key={form.key("upiVpa")}
							{...form.getInputProps("upiVpa")}
						/>
					</SimpleGrid>

					<GroupSpaceApart mt='xl'>
						<Button variant='default' type='button' onClick={onRefresh} disabled={isSaving}>
							Refresh
						</Button>

						<Group gap='md'>
							<Button variant='transparent' onClick={form.reset} disabled={!form.isDirty() || isSaving}>
								Reset
							</Button>
							<Button type='submit' disabled={!form.isDirty() || isSaving}>
								{isSaving ? "Saving..." : "Save"}
							</Button>
						</Group>
					</GroupSpaceApart>
				</Stack>
			</form>
		</Box>
	);
};
