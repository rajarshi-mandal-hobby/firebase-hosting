import { collection, doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { ElectricBill } from '../../shared/types/firestore-types';

const ElectricBillsCollection = collection(db, 'electricBills');

export const fetchElectricBillByMonth = async (month: string, refresh = false) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    throw new Error('Test Error');
  // Placeholder for electric service logic
  const electricDoc = doc(ElectricBillsCollection, month).withConverter<ElectricBill>({
    toFirestore: (data) => data,
    fromFirestore: (snapshot) => snapshot.data() as ElectricBill,
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

  if (!electricBill.exists()) {
    throw new Error(`No electric bill found for month: ${month}`, { cause: 'bill-not-found' });
  }

  return electricBill.data();
};
