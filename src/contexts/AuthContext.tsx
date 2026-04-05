import { type User } from 'firebase/auth';
import { useLoaderData, createContext } from 'react-router';

export const UserContext = createContext<User | null>(null);

export const useUser = () => useLoaderData<User>();
