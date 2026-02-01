import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, getAuthToken, getAuthUser, setAuthToken as setStorageToken, setAuthUser as setStorageUser, clearAuthToken, clearAuthUser } from '@/lib/storage/auth';
import { authApi, LoginPayload } from '@/api/auth';
import { ApiError } from '@/api/client';

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

  // Initialize from storage
  useEffect(() => {
    const initAuth = () => {
      const token = getAuthToken();
      const storedUser = getAuthUser();
      
      if (token && storedUser) {
        setUser(storedUser);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    const response = await authApi.login(payload);
    setStorageToken(response.accessToken);
    setStorageUser(response.user);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      if (user) {
        // We attempt to call the API, but even if it fails, we clear local state
        await authApi.logout().catch(console.error);
      }
    } finally {
      clearAuthToken();
      clearAuthUser();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      if (!getAuthToken()) return;
      const updatedUser = await authApi.whoami();
      setStorageUser(updatedUser);
      setUser(updatedUser);
    } catch (error) {
      // If whoami fails, it might mean the token is invalid
      console.error('Failed to refresh user', error);
      if (error instanceof ApiError && error.status === 401) {
        logout();
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
