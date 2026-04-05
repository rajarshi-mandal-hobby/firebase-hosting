import { type AuthError, signOut } from 'firebase/auth';
import { type ActionFunctionArgs, replace, type LoaderFunctionArgs } from 'react-router';
import { UserContext } from '../../contexts';
import { auth, signInWithGoogle } from '../../firebase';
import { notifyError } from './notifications';

const errMsg = (error: AuthError, defaultMsg: 'Logout failed' | 'Authentication failed') => {
    const code = error.code ? error.code.split('/').pop()?.split('-').join(' ').toUpperCase() : '';
    return defaultMsg + (code ? ` : ${code}` : '');
};

export async function authAction({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'login') {
        try {
            const res = await signInWithGoogle();
            const user = res.user;
            const tokenResult = await user.getIdTokenResult(true);
            if (!tokenResult.claims.admin) {
                await signOut(auth);
                notifyError('You are not authorized to login as admin');
            }
        } catch (error) {
            return errMsg(error as AuthError, 'Authentication failed');
        }
    }

    if (intent === 'logout') {
        try {
            await signOut(auth);
        } catch (error) {
            return errMsg(error as AuthError, 'Logout failed');
        }
    }

    return null;
}

export async function authLoader() {
    await auth.authStateReady();
    const user = auth.currentUser;
    if (user) {
        throw replace('/');
    }
    return null;
}

export const authMiddleware = async ({ context }: LoaderFunctionArgs, next: () => Promise<any>) => {
    await auth.authStateReady();
    const user = auth.currentUser;

    if (!user) {
        throw replace('/signin');
    }

    let isAdmin = false;
    const signOutOnError = async (message: string) => {
        isAdmin = false;
        await signOut(auth);
        throw replace('/signin?error=' + encodeURIComponent(message));
    };

    try {
        const tokenResult = await user.getIdTokenResult(true);
        isAdmin = !!tokenResult.claims.admin;
    } catch (error) {
        await signOutOnError(errMsg(error as AuthError, 'Authentication failed'));
    }

    if (!isAdmin) {
        await signOutOnError('not authorized');
    }

    context.set(UserContext, user);

    return await next();
};
