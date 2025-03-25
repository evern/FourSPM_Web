import React, { useState, useEffect, createContext, useContext, useCallback, PropsWithChildren } from 'react';
import { getUser, signIn as sendSignInRequest } from '../api/auth-api.service';
import { User } from '@/types';

// Define interfaces for our types
interface AuthContextType {
  user?: User;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ isOk: boolean; data?: User; message?: string }>;
  signOut: () => void;
}

// Create context with a default value matching our interface
const AuthContext = createContext<AuthContextType>({
  loading: false,
  signIn: async () => ({ isOk: false }),
  signOut: () => {}
});

function AuthProvider({ children }: PropsWithChildren<{}>) {
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState(true);

  const validateUser = useCallback(async () => {
    const result = await getUser();
    if (result.isOk && result.data) {
      setUser(result.data);
    } else {
      // If token validation fails, clear user
      setUser(undefined);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    validateUser();
  }, [validateUser]);

  // Revalidate token periodically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(validateUser, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [user, validateUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await sendSignInRequest(email, password);
    if (result.isOk && result.data) {
      setUser(result.data);
    }
    return result;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('user');
    setUser(undefined);
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        signIn, 
        signOut, 
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook with proper type inference
const useAuth = (): AuthContextType => useContext(AuthContext);

export { AuthProvider, useAuth };
export type { AuthContextType, User };
