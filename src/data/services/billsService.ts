import { getFunctions, httpsCallable } from "firebase/functions";
import type { SaveResult } from "../shemas/formResults";
import type { BillFormData } from "../../features/admin/generate-bills/hooks/useBillsForm";

export const saveBillData = async (values: BillFormData): Promise<SaveResult> => {
	const fn = httpsCallable(getFunctions(), "saveBill");
	const res = await fn(values);

	const data = res.data as SaveResult;

	if (data.success) {
		return {
			success: true
		};
	} else {
		return {
			success: false,
			errors: data.errors
		};
	}
};
