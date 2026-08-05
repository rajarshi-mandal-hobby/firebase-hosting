import { beforeUserCreated, beforeUserSignedIn, HttpsError } from 'firebase-functions/v2/identity';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';

// Define your approved admin email addresses
const ALLOWED_ADMINS = ['your-admin-email@gmail.com', 'another-admin@company.com'];

// 1. Block unauthorized registration
export const beforeCreated = beforeUserCreated(async (event) => {
    const user = event.data;

    logger.info('User created: ', await getAuth().getUser(user?.uid || ''));

    if (!user?.email || !ALLOWED_ADMINS.includes(user.email)) {
        throw new HttpsError('permission-denied', 'Unauthorized access. Only pre-approved admins may log in.');
    }
});

// 2. Block unauthorized sign-in (Optional but recommended for strict safety)
export const beforeSignIn = beforeUserSignedIn(async (event) => {
    const user = event.data;

    const isAdmin = user?.customClaims?.role === 'admin';

    if (!isAdmin) {
        throw new HttpsError('permission-denied', 'Unauthorized access. Only pre-approved admins may log in.');
    }
});
