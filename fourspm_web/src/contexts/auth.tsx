import React, { useState, useEffect, createContext, useContext, useCallback, PropsWithChildren } from 'react';
import { getUser, signIn as sendSignInRequest } from '../api/auth';
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

  useEffect(() => {
    (async function () {
      const result = await getUser();
      if (result.isOk && result.data) {
        setUser(result.data);
      }
      setLoading(false);
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await sendSignInRequest(email, password);
    if (result.isOk && result.data) {
      setUser(result.data);
    }
    return result;
  }, []);

  const signOut = useCallback(() => {
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
