import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from './index.js';
import { MEMBERS_COL } from './types/constansts.js';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Scheduled to run at 00:00 on the 1st of every month.
 * Stays within the 20,000 free daily delete quota.
 */
export const monthlyCleanup = onSchedule('0 0 1 * *', async () => {
    const now = Timestamp.now().toDate();

    // 1. Query for expired documents
    // Safety limit of 15k to leave room for regular app activity
    const expiredQuery = db.collection(MEMBERS_COL).where('ttlExpiry', '<=', now).limit(500);

    const snapshot = await expiredQuery.get();

    if (snapshot.empty) {
        logger.info('No expired members found for cleanup.');
        return;
    }

    // 2. Perform recursive deletes
    // This deletes the doc AND all its subcollections (like rent history)
    const deletePromises = snapshot.docs.map((doc) => db.recursiveDelete(doc.ref));

    try {
        await Promise.all(deletePromises);
        logger.info(`Successfully cleaned up ${snapshot.size} expired members and their subcollections.`);
    } catch (error) {
        logger.error('Cleanup failed:', error);
    }
});
