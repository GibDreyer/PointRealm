import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import {
  AuthSession,
  AuthUser,
  clearAuthState,
  getAuthSession,
  getAuthToken,
  getAuthUser,
  setAuthNotice,
  setAuthSession,
  setAuthUser as setStorageUser,
} from '@/lib/storage/auth';
import { authApi, LoginPayload } from '@/api/auth';
import { ApiError } from '@/api/client';

const REFRESH_BUFFER_MS = 2 * 60 * 1000;

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<number | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  };

  const applyAuthState = (nextUser: AuthUser, session: AuthSession) => {
    setAuthSession(session);
    setStorageUser(nextUser, { persist: session.persist });
    setUser(nextUser);
  };

  const logout = async () => {
    clearRefreshTimer();
    try {
      await authApi.logout().catch(console.error);
    } finally {
      clearAuthState();
      setUser(null);
    }
  };

  const handleSessionFailure = async (message: string) => {
    setAuthNotice(message);
    await logout();
  };

  const refreshSession = async (reason: 'rotation' | 'recovery') => {
    try {
      const currentSession = getAuthSession();
      const response = await authApi.refresh();
      applyAuthState(response.user, {
        token: response.accessToken,
        expiresAt: response.expiresAt,
        persist: currentSession?.persist ?? false,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const message = reason === 'rotation'
          ? 'Your session expired. Please sign in again.'
          : 'Your session is no longer valid. Please sign in again.';
        await handleSessionFailure(message);
        return;
      }

      console.error('Failed to refresh auth session', error);
    }
  };

  const scheduleRefresh = () => {
    clearRefreshTimer();
    const session = getAuthSession();
    if (!session) return;

    const delay = Date.parse(session.expiresAt) - Date.now() - REFRESH_BUFFER_MS;
    if (delay <= 0) {
      void refreshSession('rotation');
      return;
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      void refreshSession('rotation');
    }, delay);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = getAuthSession();
        const storedUser = getAuthUser();

        if (!session || !storedUser) {
          setIsLoading(false);
          return;
        }

        setUser(storedUser);

        const refreshSoon = Date.parse(session.expiresAt) - Date.now() <= REFRESH_BUFFER_MS;
        if (refreshSoon) {
          await refreshSession('recovery');
        } else {
          scheduleRefresh();
        }
      } finally {
        setIsLoading(false);
      }
    };

    void initAuth();

    return () => {
      clearRefreshTimer();
    };
  }, []);

  useEffect(() => {
    if (user && getAuthToken()) {
      scheduleRefresh();
    }
  }, [user]);

  const login = async (payload: LoginPayload) => {
    const response = await authApi.login(payload);
    applyAuthState(response.user, {
      token: response.accessToken,
      expiresAt: response.expiresAt,
      persist: payload.rememberMe,
    });
    scheduleRefresh();
  };

  const refreshUser = async () => {
    try {
      if (!getAuthToken()) return;
      const updatedUser = await authApi.whoami();
      const currentSession = getAuthSession();
      setStorageUser(updatedUser, { persist: currentSession?.persist ?? false });
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user', error);
      if (error instanceof ApiError && error.status === 401) {
        await handleSessionFailure('Your session is no longer valid. Please sign in again.');
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
