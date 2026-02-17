import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions';

// Initialize Firebase Admin
const app = initializeApp();

export const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });
// Set global options for all functions
setGlobalOptions({
    region: 'asia-south1', // Mumbai region for lower latency in India
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '256MiB'
});

// Export all function modules
export * from './default-ops.js';
export * from './member-ops.js';
export * from './billing-ops.js';
