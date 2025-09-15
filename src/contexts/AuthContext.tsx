import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { notifications } from '@mantine/notifications';

// Context value shape
export interface InternalAuthUser {
  firebaseUid: string;
  email: string;
  name: string;
  photoURL?: string | null;
  providerId?: string;
  raw: User;
}

export interface AuthContextValue {
  user: InternalAuthUser | null;
  rawUser: User | null; // raw firebase user for advanced needs
  initializing: boolean;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider
 * Production-ready Firebase Auth context with Google Sign-In support.
 * - Subscribes to auth state (onAuthStateChanged)
 * - Supports emulator (handled in firebase.ts when MODE === 'development')
 * - Provides sign-in with popup + redirect fallback, sign out, token helpers
 * - Graceful error handling + user notifications
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Subscribe to auth state
  useEffect(() => {
    const ownerEmails = (import.meta.env.VITE_OWNER_EMAIL || import.meta.env.VITE_OWNER_EMAILS || '')
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setRawUser(firebaseUser);
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const claims = tokenResult.claims as Record<string, any>;
          const claimAdmin = !!claims.admin || !!claims.isAdmin;
          // owner email if provided counts as admin
          const emailAdmin = firebaseUser.email ? ownerEmails.includes(firebaseUser.email.toLowerCase()) : false;
          setIsAdmin(claimAdmin || emailAdmin);
        } catch (e) {
          console.warn('Failed to load custom claims', e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      if (initializing) setInitializing(false);
    });
    return () => unsubscribe();
  }, [initializing]);

  const showError = useCallback((message: string, err?: unknown) => {
    console.error(message, err);
    setError(message);
    notifications.show({
      title: 'Authentication Error',
      message,
      color: 'red',
      position: 'bottom-center',
    });
  }, []);

  const signIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        // Fallback to redirect (e.g., popup blocked)
        if (popupError?.code === 'auth/popup-blocked' || popupError?.code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
      notifications.show({
        title: 'Signed In',
        message: 'You are now signed in.',
        color: 'green',
        position: 'bottom-center',
      });
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign in';
      showError(msg, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const signOutFn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      notifications.show({
        title: 'Signed Out',
        message: 'You have been signed out.',
        color: 'blue',
        position: 'bottom-center',
      });
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign out';
      showError(msg, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const getIdToken = useCallback(
    async (forceRefresh = false): Promise<string | null> => {
      try {
        if (!auth.currentUser) return null;
        return await auth.currentUser.getIdToken(forceRefresh);
      } catch (err) {
        showError('Failed to retrieve ID token', err);
        return null;
      }
    },
    [showError]
  );

  const refreshUser = useCallback(async () => {
    try {
      if (auth.currentUser) await auth.currentUser.reload();
    } catch (err) {
      showError('Failed to refresh user', err);
    }
  }, [showError]);

  const mappedUser: InternalAuthUser | null = useMemo(
    () =>
      rawUser
        ? {
            firebaseUid: rawUser.uid,
            email: rawUser.email || '',
            name: rawUser.displayName || rawUser.email?.split('@')[0] || 'User',
            photoURL: rawUser.photoURL,
            providerId: rawUser.providerData[0]?.providerId,
            raw: rawUser,
          }
        : null,
    [rawUser]
  );

  const value: AuthContextValue = useMemo(
    () => ({
      user: mappedUser,
      rawUser,
      initializing,
      loading,
      error,
      isAdmin,
      signIn,
      signOut: signOutFn,
      getIdToken,
      refreshUser,
    }),
    [mappedUser, rawUser, initializing, loading, error, isAdmin, signIn, signOutFn, getIdToken, refreshUser]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export { AuthContext };
