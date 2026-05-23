import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
    initializeFirestore,
    persistentLocalCache,
    terminate,
    clearIndexedDbPersistence,
    connectFirestoreEmulator,
    memoryLocalCache,
} from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

// Demo config for emulator
const firebaseConfig = {
    apiKey: 'AIzaSyDummy_API_KEY_FOR_EMULATOR',
    authDomain: 'rajarshi-mess.firebaseapp.com',
    projectId: 'demo-rajarshi-mess',
    storageBucket: 'rajarshi-mess.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456789',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Google Auth Provider
export const auth = getAuth(app);

// Initialize Firestore DB
const isBrowser = typeof window !== 'undefined';
export const db = initializeFirestore(app, {
    localCache: isBrowser ? persistentLocalCache({ cacheSizeBytes: 10 * 1024 * 1024 }) : memoryLocalCache(),
});

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
