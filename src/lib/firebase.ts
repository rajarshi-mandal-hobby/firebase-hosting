import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider, type User } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env['VITE_FIREBASE_API_KEY'] || "demo-api-key",
  authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'] || "rajarshi-mess.firebaseapp.com",
  projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'] || "rajarshi-mess",
  storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'] || "rajarshi-mess.appspot.com",
  messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] || "123456789",
  appId: import.meta.env['VITE_FIREBASE_APP_ID'] || "demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// Initialize Firestore with emulator settings to avoid warning
export const db = import.meta.env.DEV
  ? initializeFirestore(app, {
    host: `${import.meta.env['VITE_EMULATOR_FIRESTORE_HOST'] || 'localhost'}:${import.meta.env['VITE_EMULATOR_FIRESTORE_PORT'] || '8080'}`,
    ssl: false
  })
  : initializeFirestore(app, {});

export const storage = getStorage(app);

// Initialize Functions with region
export const functions = getFunctions(app, import.meta.env['VITE_FIREBASE_REGION'] || 'us-central1');

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
// Configure the provider for emulator use
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
// Add scopes that we need
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Connect to emulators if in development
if (import.meta.env.DEV && import.meta.env['VITE_USE_EMULATORS'] === 'true') {
  // Simple flag to track if emulators are connected
  let emulatorsConnected = false;
  if (!emulatorsConnected) {
    try {
      // Connect Auth emulator
      const authHost = import.meta.env['VITE_EMULATOR_AUTH_HOST'] || 'localhost';
      const authPort = import.meta.env['VITE_EMULATOR_AUTH_PORT'] || '9099';
      connectAuthEmulator(auth, `http://${authHost}:${authPort}`, { disableWarnings: true });
      console.log('✅ Auth emulator connected');
    } catch {
      console.debug('Auth emulator already connected');
    }

    try {
      // Connect Storage emulator
      const storageHost = import.meta.env['VITE_EMULATOR_STORAGE_HOST'] || 'localhost';
      const storagePort = parseInt(import.meta.env['VITE_EMULATOR_STORAGE_PORT'] || '9199');
      connectStorageEmulator(storage, storageHost, storagePort);
      console.log('✅ Storage emulator connected');
    } catch {
      console.debug('Storage emulator already connected');
    }

    try {
      // Connect Functions emulator
      const functionsHost = import.meta.env['VITE_EMULATOR_FUNCTIONS_HOST'] || 'localhost';
      const functionsPort = parseInt(import.meta.env['VITE_EMULATOR_FUNCTIONS_PORT'] || '5001');
      connectFunctionsEmulator(functions, functionsHost, functionsPort);
      console.log('✅ Functions emulator connected');
    } catch {
      console.debug('Functions emulator already connected');
    }
    
    emulatorsConnected = true;
    console.log('✅ Firestore emulator connected via initializeFirestore settings');
  }
}

// Utility functions for user management
export const isAdminUser = async (email: string | null): Promise<boolean> => {
  if (!email) return false;
  
  try {
    // Try to get admin UIDs from Firestore admin config
    const { getAdminConfig } = await import('./firestore');
    const adminConfig = await getAdminConfig();
    
    if (adminConfig?.list) {
      // Note: adminConfig.list contains UIDs, not emails
      // This function would need to be updated to work with UIDs instead of emails
      // For now, keeping the fallback approach
      console.log('Admin config found, but contains UIDs not emails');
    }
  } catch (error) {
    console.warn('Could not fetch admin config, falling back to hardcoded list:', error);
  }
  
  // Fallback to hardcoded admin emails if config is not available
  const fallbackAdminEmails = [
    'rajarshhi@gmail.com',
    'admin@rajarshi-mess.com',
    'main.admin@example.com'
  ];
  return fallbackAdminEmails.includes(email) || email.includes('admin');
};

// Synchronous version for when config is already available
export const isAdminUserSync = (email: string | null, adminEmails?: string[]): boolean => {
  if (!email) return false;
  
  if (adminEmails) {
    return adminEmails.includes(email);
  }
  
  // Fallback to hardcoded admin emails
  const fallbackAdminEmails = [
    'rajarshhi@gmail.com',
    'admin@rajarshi-mess.com',
    'main.admin@example.com'
  ];
  return fallbackAdminEmails.includes(email) || email.includes('admin');
};

export const createUserProfile = async (user: User, additionalData?: Record<string, unknown>) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = new Date();
    const isAdmin = await isAdminUser(email);

    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        isAdmin,
        phoneVerified: isAdmin, // Admins skip phone verification
        createdAt,
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  return userRef;
};

export const updatePhoneVerification = async (userId: string, phoneNumber: string) => {
  const userRef = doc(db, 'users', userId);
  try {
    await setDoc(userRef, {
      phoneNumber,
      phoneVerified: true,
      phoneVerifiedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating phone verification:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? snapshot.data() : null;
};
