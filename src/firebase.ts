import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
    terminate,
    clearIndexedDbPersistence,
    connectFirestoreEmulator,
    runTransaction,
    Transaction,
    getFirestore,
    FirestoreError
} from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { notifyError, notifyLoading, notifySuccess } from './shared/utils';

// Demo config for emulator
const firebaseConfig = {
    apiKey: 'AIzaSyDummy_API_KEY_FOR_EMULATOR',
    authDomain: 'rajarshi-mess.firebaseapp.com',
    projectId: 'demo-rajarshi-mess',
    storageBucket: 'rajarshi-mess.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456789'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Google Auth Provider
export const auth = getAuth(app);

// Initialize Firestore DB
const isBrowser = typeof window !== 'undefined';

export const db = getFirestore(app);

interface TransactionConfig {
    formName: string;
    loadingMessage?: string;
    successMessage?: string;
}

interface TransactionCallbacks {
    onError?: (error: Error, notifyId?: string) => void;
    onFinally?: (notifyId?: string) => void;
}

export const runTransactionWrapper = async <Data>(
    config: TransactionConfig,
    func: (transaction: Transaction) => Promise<Data>,
    callbacks?: TransactionCallbacks
): Promise<Data> => {
    const { formName, loadingMessage = 'Processing...', successMessage = 'Saved successfully!' } = config;
    const { onError, onFinally } = callbacks ?? {};

    const notifyId = notifyLoading(loadingMessage);

    try {
        const result = await runTransaction(db, func, { maxAttempts: 3 });
        notifySuccess(successMessage, { id: notifyId, update: true });
        return result;
    } catch (error) {
        const isFirestoreError = error && typeof error === 'object' && 'code' in error;
        const errCode = isFirestoreError ? (error as FirestoreError).code : 'unknown-error';
        const errMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

        onError?.(error as Error, notifyId);

        notifyError(errMessage, {
            id: notifyId,
            update: true,
            title: `${formName} Error (${errCode})`
        });

        throw error; // Re-throw so the calling component knows it failed
    } finally {
        onFinally?.(notifyId);
    }
};

export const myRunTransation = async <Data>(func: (transaction: Transaction) => Promise<Data>) =>
    await runTransaction(db, func, { maxAttempts: 3 });

// Initialize Firebase Functions
export const functions = getFunctions(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Google Sign In
export const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());

// Clear Firestore Cache
export const clearFirestoreCache = async () => {
    await terminate(db);
    await clearIndexedDbPersistence(db);
};

// Connect to Firebase Emulators
if (import.meta.env.DEV || (isBrowser && window.location.hostname === 'localhost')) {
    console.log('🟢 Running in local mode');

    try {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    } catch (error) {
        console.error('⚠️ Failed to connect to Auth Emulator:', error);
    }
    try {
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
    } catch (error) {
        console.error('⚠️ Failed to connect to Firestore Emulator:', error);
    }
    try {
        connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    } catch (error) {
        console.error('⚠️ Failed to connect to Functions Emulator:', error);
    }
    try {
        connectStorageEmulator(storage, '127.0.0.1', 9199);
    } catch (error) {
        console.error('⚠️ Failed to connect to Storage Emulator:', error);
    }

    console.log(`🔥 Connected to Firebase Emulators. To kill emulators, run: npm run emulators:kill`);
}
