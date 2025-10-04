import { onCall } from 'firebase-functions/v2/https';
import { validateAuth } from './utils/validation';
import { GlobalSettingsInput, SaveResponse, zodGlobalSettingsInput } from './schemas';
import { db } from '.';
import z from 'zod';
import { logger } from 'firebase-functions';

exports.saveGlobalSettings = onCall({ cors: false }, async (req): Promise<SaveResponse<GlobalSettingsInput>> => {
  logger.info('saveGlobalSettings called', req.data);
  validateAuth(req);
  // Parse and validate input
  const result = zodGlobalSettingsInput(req.data);

  logger.info('Validation result:', result);

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
