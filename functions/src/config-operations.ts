import { onCall } from 'firebase-functions/v2/https';
import { validateAuth } from './utils/validation';
import { GlobalSettingsValidationResult } from './schemas';
import { db } from '.';
import * as v from 'valibot';

type SaveResponse =
  | {
      success: boolean;
    }
  | {
      success: false;
      errors: v.FlatErrors<any>;
    };

exports.saveGlobalSettings = onCall({ cors: false }, async (req): Promise<SaveResponse> => {
  validateAuth(req);
  // Parse and validate input
  const result = GlobalSettingsValidationResult(req.data);

  if (!result.success) {
    return {
      success: false,
      errors: v.flatten(result.issues),
    };
  }

  const docRef = db.collection('config').doc('globalSettings');

  await docRef.set(result.output, { merge: true });

  return {
    success: true,
  };
});
