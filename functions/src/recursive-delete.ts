import { onCall } from 'firebase-functions/v2/https';
import { db } from './index.js';

export const deleteMember = onCall(async (request) => {
    const { data } = request;

    // if (!(auth && auth.token && auth.token.admin)) {
    //     throw new HttpsError('permission-denied', 'Must be an administrative user to initiate delete.');
    // }

    const memberId = data.memberId as string;
    const memberDocRef = db.doc(`members/${memberId}`);

    await db.recursiveDelete(memberDocRef);
});
