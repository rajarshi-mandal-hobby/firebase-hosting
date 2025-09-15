// Compatibility auth hook expected by existing feature code
// Wraps the new AuthContext (AuthProvider/useAuthContext) and exposes a stable API.
import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthContext';

export const useAuth=(): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
