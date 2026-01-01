import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../firebase";
import type { SaveResult } from "../shemas/formResults";
import { type DefaultValues } from "../types";
import { simulateNetworkDelay, simulateRandomError } from "../utils/serviceUtils";

const configDocRef = doc(db, "defaults", "values").withConverter<DefaultValues>({
	toFirestore: (data) => data,
	fromFirestore: (snap) => snap.data() as DefaultValues
});
let cache: DefaultValues | null = null;
let currentFetchPromise: Promise<DefaultValues> | null = null;

export const fetchDefaultValues = async (refresh = false): Promise<DefaultValues> => {
	if (refresh) {
		cache = null;
		currentFetchPromise = null;
	}

	// If data is in cache, return a resolved promise immediately
	if (cache) {
		return Promise.resolve(cache);
	}

	// If a fetch is in progress, return the existing promise
	if (currentFetchPromise) {
		return currentFetchPromise;
	}

	// Create a new promise and store it
	const newPromise = (async () => {
		try {
			await simulateNetworkDelay();
			simulateRandomError();
			const docSnapshot = await getDoc(configDocRef);

			if (!docSnapshot.exists()) {
				throw new Error("Default Values document missing");
			}

			const data = docSnapshot.data();
			cache = data; // Cache the data
			return data;
		} finally {
			currentFetchPromise = null; // Clear the promise reference when done
		}
	})();

	// Store the promise for future use
	currentFetchPromise = newPromise;
	return newPromise;
};

/**
 * Save default values with proper error handling and validation
 */
export const saveDefaultValues = async (updates: any): Promise<SaveResult> => {
	try {
		const fn = httpsCallable(functions, "saveDefaultValues");
		const res = await fn(updates);

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
	} catch (error) {
		console.error("Error saving default values:", error);
		throw error;
	}
};
