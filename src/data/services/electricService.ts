import { collection, doc, getDoc, getDocFromServer } from "firebase/firestore";
import { db } from "../../firebase";
import { simulateNetworkDelay } from "../utils/serviceUtils";
import type { ElectricBill } from "../types";
import { ELECTRICITY } from "../types/constants";

const ElectricBillsCollection = collection(db, ELECTRICITY.COL);

const cache: Map<string, ElectricBill> = new Map();
const currentFetchPromises: Map<string, Promise<ElectricBill>> = new Map();

export const fetchElectricBill = async (month: string, refresh = false) => {
   if (refresh) {
      cache.delete(month);
      currentFetchPromises.delete(month);
   }

   // If data is in cache, return a resolved promise immediately
   if (cache.has(month)) {
      return Promise.resolve(cache.get(month)!);
   }

   // If a fetch is in progress for this month, return the existing promise
   if (currentFetchPromises.has(month)) {
      return currentFetchPromises.get(month)!;
   }

   // Create a new promise and store it
   const newPromise = (async () => {
      await simulateNetworkDelay(500); // Simulate network delay for UX (adjust as needed)
      try {
         const electricDoc = doc(ElectricBillsCollection, month).withConverter<ElectricBill>({
            toFirestore: (data) => data,
            fromFirestore: (snapshot) => snapshot.data() as ElectricBill
         });

         let electricBill;
         if (refresh) {
            electricBill = await getDocFromServer(electricDoc);
         } else {
            try {
               electricBill = await getDoc(electricDoc);
            } catch {
               electricBill = await getDocFromServer(electricDoc);
            }
         }

         //   throw new Error(`No electric bill found for month: ${month}`, { cause: 'bill-not-found' });

         if (!electricBill.exists()) {
            throw new Error(`No electric bill found for month: ${month}`, { cause: "bill-not-found" });
         }

         console.log(
            electricBill.metadata.fromCache ? "Electric bill loaded from cache" : "Electric bill loaded from server"
         );
         const data = electricBill.data();
         cache.set(month, data); // Cache the data for this month
         return data;
      } finally {
         currentFetchPromises.delete(month); // Clear the promise reference when done
      }
   })();

   currentFetchPromises.set(month, newPromise);
   return newPromise;
};
