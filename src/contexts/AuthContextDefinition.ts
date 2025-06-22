import { createContext } from "react";
import type { User } from "firebase/auth";

interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  isAdmin: boolean;
  phoneVerified: boolean;
  phoneNumber?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  authInitialized: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

export type { UserProfile, AuthContextType };

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
