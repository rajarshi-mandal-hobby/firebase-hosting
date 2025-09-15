import { onCall } from 'firebase-functions/v2/https';
import { validateAuth } from './utils/validation';
import { GlobalSettingsInput, SaveResponse, zodGlobalSettingsInput } from './schemas';
import { db } from '.';
import z from 'zod';

exports.saveGlobalSettings = onCall({ cors: false }, async (req): Promise<SaveResponse<GlobalSettingsInput>> => {
  validateAuth(req);
  // Parse and validate input
  const result = zodGlobalSettingsInput(req.data);

  if (!result.success) {
    return {
      success: false,
      errors: z.flattenError(result.error),
    };
  }

  const docRef = db.collection('config').doc('globalSettings');
  await docRef.set(result.data, { merge: true });

  return {
    success: true,
  };
});
