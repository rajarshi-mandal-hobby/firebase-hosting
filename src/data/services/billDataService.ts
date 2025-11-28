import { getFunctions, httpsCallable } from 'firebase/functions';
import type { GenerateBillFormData } from '../../features/admin/generate-bills/hooks/useGenerateBillsForm';
import type { SaveResult } from '../shemas/formResults';

export const saveBillData = async (values: GenerateBillFormData): Promise<SaveResult> => {
  // Simulate saving bill data
  const fn = httpsCallable(getFunctions(), 'saveBills');
  const res = await fn(values);

  const data = res.data as unknown as SaveResult;

  if (data.success) {
    return {
      success: true,
    };
  } else {
    return {
      success: false,
      errors: data.errors,
    };
  }
};
