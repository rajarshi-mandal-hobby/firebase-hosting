import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { validateAuth } from "./utils/validation.js";
import { db } from "./index.js";
import { parseDefaultRentsSchema } from "./schemas/config.js";
import { DEFAULT_COL, DefaultValues, type SaveResponse, VALUES_DOC } from "./types/index.js";
import * as v from "valibot";

export const saveDefaultRents = onCall({ cors: true }, async (req): Promise<SaveResponse> => {
	validateAuth(req);

	const result = parseDefaultRentsSchema(req.data);

	if (!result.success) {
		return {
			success: false,
			errors: v.flatten(result.issues)
		};
	}

	const docRef = db.collection(DEFAULT_COL).doc(VALUES_DOC);

	const defaultValue: Partial<DefaultValues> = {
		bedRents: {
			"2nd": {
				Bed: result.output.secondBed,
				Room: result.output.secondRoom,
				Special: result.output.secondSpecial
			},
			"3rd": {
				Bed: result.output.thirdBed,
				Room: result.output.thirdRoom
			}
		},
		securityDeposit: result.output.securityDeposit,
		wifiMonthlyCharge: result.output.wifiMonthlyCharge,
		upiVpa: result.output.upiVpa
	};

	return db.runTransaction(async (transaction) => {
		try {
			const doc = await transaction.get(docRef);
			if (doc.exists) {
				transaction.update(docRef, defaultValue);
			} else {
				transaction.set(docRef, defaultValue);
			}
			return {
				success: true
			};
		} catch (error) {
			logger.error(error);
			throw error;
		}
	});
});
