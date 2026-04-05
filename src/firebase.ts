// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    connectAuthEmulator,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    type User
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyDummy_API_KEY_FOR_EMULATOR', // Dummy key for emulator
    authDomain: 'rajarshi-mess.firebaseapp.com',
    projectId: 'rajarshi-mess',
    storageBucket: 'rajarshi-mess.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456789'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
// Initialize Google Auth Provider

// export const db = initializeFirestore(app, {
//   localCache: persistentLocalCache({ cacheSizeBytes: 10 * 1024 * 1024 }), // 10 MB cache
// });
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

export const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());

export const getCurrentUser = (): Promise<User | null> => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                unsubscribe();
                resolve(user);
            },

            reject
        );
    });
};

// Connect to emulators in development
if (import.meta.env.DEV) {
    console.log('🔥 Connecting to Firebase Emulators...');

    try {
        // Connect to Auth emulator
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        console.log('✅ Connected to Auth Emulator');
    } catch {
        console.log('Auth emulator already connected or failed to connect');
    }

    try {
        // Connect to Firestore emulator
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        console.log('✅ Connected to Firestore Emulator');
    } catch {
        console.log('Firestore emulator already connected or failed to connect');
    }

    try {
        // Connect to Functions emulator
        connectFunctionsEmulator(functions, '127.0.0.1', 5001);
        console.log('✅ Connected to Functions Emulator');
    } catch {
        console.log('Functions emulator already connected or failed to connect');
    }

    try {
        // Connect to Storage emulator
        connectStorageEmulator(storage, '127.0.0.1', 9199);
        console.log('✅ Connected to Storage Emulator');
    } catch {
        console.log('Storage emulator already connected or failed to connect');
    }
}
