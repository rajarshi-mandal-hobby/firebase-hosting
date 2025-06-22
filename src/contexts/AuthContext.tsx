import React, { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import type { ReactNode } from "react";
import { auth, googleProvider, createUserProfile, getUserProfile } from "../lib/firebase";
import { AuthContext, type AuthContextType, type UserProfile } from "./AuthContextDefinition";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Overall loading state
  const [profileLoading, setProfileLoading] = useState(false); // Profile operations
  const [authInitialized, setAuthInitialized] = useState(false); // Auth state listener initialized

  // Memoize refreshUserProfile to prevent infinite loops
  const refreshUserProfile = useCallback(async () => {
    if (user) {
      setProfileLoading(true);
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile as UserProfile);
        console.log("User profile refreshed:", profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    } else {
      setUserProfile(null);
      setProfileLoading(false);
    }
  }, [user]);
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // In development with emulators, we might encounter OAuth popup issues
      // Let's add better error handling and fallback
      console.log("Attempting Google sign-in...");
        const result = await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in successful:", result.user.email);
      // Don't manually set loading to false here - let onAuthStateChanged handle it
    } catch (error: unknown) {
      console.error("Error signing in with Google:", error);
      
      // Handle specific OAuth errors
      const authError = error as { code?: string; message?: string };
      if (authError.code === 'auth/popup-closed-by-user') {
        console.log("User closed the popup");
      } else if (authError.code === 'auth/popup-blocked') {
        console.log("Popup was blocked by browser");
      } else if (authError.code === 'auth/cancelled-popup-request') {
        console.log("Popup request was cancelled");
      }
      
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      console.log("Sign out successful");
    } catch (error) {
      console.error("Error signing out:", error);
      setLoading(false);
      throw error;
    }
  };

  // Main auth state listener
  useEffect(() => {
    console.log("Setting up auth state listener...");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email || "No user");
      
      if (firebaseUser) {
        setUser(firebaseUser);
        setProfileLoading(true);
        
        try {
          // Ensure user profile exists in Firestore
          await createUserProfile(firebaseUser);
          // Fetch the user profile
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile as UserProfile);
          console.log("User profile loaded:", profile);
        } catch (error) {
          console.error("Error handling auth state change:", error);
          setUserProfile(null);
        } finally {
          setProfileLoading(false);
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setProfileLoading(false);
        setLoading(false);
      }
      
      // Mark auth as initialized after first state change
      if (!authInitialized) {
        setAuthInitialized(true);
        console.log("Auth state listener initialized");
      }
    });

    return unsubscribe;
  }, [authInitialized]); // Include authInitialized in dependencies
  
  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    profileLoading,
    authInitialized,
    signInWithGoogle,
    logout,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
