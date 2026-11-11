import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { loadStoredToken, saveToken, setUnauthorizedHandler } from './api';
import { getCurrentUser, loginRequest } from './services';

type User = { id?: string; username: string; fullName?: string; email?: string; role?: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    await saveToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      saveToken(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await loadStoredToken();
        if (token) {
          const me = await getCurrentUser();
          if (active) setUser(me ?? null);
        }
      } catch {
        await saveToken(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const data = await loginRequest(username.trim(), password);
    await saveToken(data.accessToken);
    let me = data.user;
    if (!me) me = await getCurrentUser();
    setUser(me ?? { username });
    router.replace('/' as any);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong AuthProvider');
  return ctx;
}

