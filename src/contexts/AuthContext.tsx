import { createContext, use, useState, useEffect, useTransition, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User, type AuthError } from 'firebase/auth'; // Adjust imports based on your library
import { auth, signInWithGoogle } from '../firebase';
import { notifyError } from '../shared/utils';

interface AuthStore {
    user: User | null;
    handleSignIn: () => void;
    handleSignOut: () => void;
    pending: boolean;
    isAuthState: boolean;
}

// 1. Create context with an empty object cast to bypass unnecessary null checks
const AuthContext = createContext<AuthStore>({} as AuthStore);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [pending, startTransition] = useTransition();
    const [isAuthState, setIsAuthState] = useState(false);
    const notifyId = 'auth_error';

    const handleSignOut = () => {
        // 2. Wrap async actions in startTransition to automatically manage pending state
        startTransition(async () => {
            try {
                await signOut(auth);
            } catch (error) {
                console.error('Sign Out Error: ', error);
            }
        });
    };

    const handleSignIn = () => {
        startTransition(async () => {
            try {
                await signInWithGoogle();
            } catch (error) {
                const err = error as AuthError;
                notifyError(err.message, { title: err.code, id: notifyId });
                console.error('Sign In Error: ', err);
                handleSignOut();
            }
        });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (currentUser) => {
                setUser(currentUser);
                setIsAuthState(true);
            },
            (error) => {
                const err = error as AuthError;
                console.error('Auth State Error: ', error);
                notifyError(err.message, { title: err.code, id: notifyId });
                setIsAuthState(true);
                handleSignOut();
            }
        );

        return () => unsubscribe();
    }, []);

    // 4. Native <AuthContext> tag usage and implicit loading state via 'pending'
    return (
        <AuthContext value={{ user, handleSignIn, handleSignOut, pending, isAuthState }}>{children}</AuthContext>
    );
};

export const useAuth = () => {
    // 5. Clean consumption using the React 19 use() hook
    return use(AuthContext);
};
