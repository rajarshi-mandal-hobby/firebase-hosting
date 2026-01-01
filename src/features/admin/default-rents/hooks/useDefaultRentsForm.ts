import { useForm } from "@mantine/form";
import { useState } from "react";
import { saveDefaultValues } from "../../../../data/services/defaultsService";
import { type DefaultValues } from "../../../../data/types/";
import { notifyError, notifySuccess } from "../../../../shared/utils/notifications";
import { valibotResolver } from "mantine-form-valibot-resolver";
import { DefaultRentsSchema } from "../utils/validationSchemas";
import * as valibot from "valibot";

type DefaultRentsFormValues = {
	secondBed: string | number;
	secondRoom: string | number;
	secondSpecial: string | number;
	thirdBed: string | number;
	thirdRoom: string | number;
	securityDeposit: string | number;
	wifiMonthlyCharge: string | number;
	upiVpa: string;
};

export const useDefaultRentsForm = (values: DefaultValues | null, handleRefresh: () => void) => {
	const [isSaving, setIsSaving] = useState(false);

	const form = useForm<DefaultRentsFormValues>({
		mode: "uncontrolled",
		initialValues: {
			secondBed: values?.bedRents["2nd"].Bed ?? "",
			secondRoom: values?.bedRents["2nd"].Room ?? "",
			secondSpecial: values?.bedRents["2nd"].Special ?? "",
			thirdBed: values?.bedRents["3rd"].Bed ?? "",
			thirdRoom: values?.bedRents["3rd"].Room ?? "",
			securityDeposit: values?.securityDeposit ?? "",
			wifiMonthlyCharge: values?.wifiMonthlyCharge ?? "",
			upiVpa: values?.upiVpa ?? ""
		},
		validate: valibotResolver(DefaultRentsSchema),
		validateInputOnBlur: true,
		transformValues: (values) => valibot.parse(DefaultRentsSchema, values)
	});

	const handleSave = async (values: DefaultRentsFormValues) => {
		setIsSaving(true);
		try {
			const result = await saveDefaultValues(values);
			if (result.success) {
				handleRefresh();
				notifySuccess("Default rents saved successfully.");
			} else {
				form.setErrors(result.errors?.nested || {});
				notifyError("Please check the form for errors.");
			}
		} catch (error) {
			notifyError("Save failed");
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	return { form, isSaving, handleSave };
};
