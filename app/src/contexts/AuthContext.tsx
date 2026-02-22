'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextValue {
  isAuthorized: boolean;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthorized: false,
  loading: true,
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authorized = document.cookie
      .split('; ')
      .some((c) => c.startsWith('beta_authorized=true'));
    setIsAuthorized(authorized);
    setLoading(false);
  }, []);

  const signOut = () => {
    document.cookie = 'beta_authorized=; path=/; max-age=0';
    setIsAuthorized(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ isAuthorized, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
