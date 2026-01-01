// src/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'; // Import the User type
import { auth, googleProvider } from '../firebase';

// 1. Define the shape of the context data
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

// 2. Create the context with an initial value (can be an empty object asserted as the type)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Define props for the Provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null); // Type the user state
  const [loading, setLoading] = useState(true);

  // Sign in with Google (return types are inferred as Promises, no explicit typing needed here)
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const err = error as Error;
      console.error('Error signing in with Google:', err.message);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      const err = error as Error;
      console.error('Error signing out:', err.message);
    }
  };

  // Manage user state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe; // Clean up subscription on unmount
  }, []);

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. Custom hook to use the AuthContext with a safety check
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
