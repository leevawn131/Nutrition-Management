import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types/auth.types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('admin_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state on mount by validating token with backend GET /api/auth/me
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = localStorage.getItem('admin_token');
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await authService.getMe();
        if (isMounted) {
          if (res.success && res.data.user.role === 'admin') {
            setUser(res.data.user);
            setToken(storedToken);
            localStorage.setItem('admin_user', JSON.stringify(res.data.user));
          } else {
            // Not an admin user
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            setUser(null);
            setToken(null);
          }
        }
      } catch (error) {
        console.warn('Session check failed or expired:', error);
        if (isMounted) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Đăng nhập không thành công.');
    }

    const { user: loggedInUser, accessToken } = res.data;

    // Strict role check: Ordinary users cannot access Admin Web
    if (loggedInUser.role !== 'admin') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      throw new Error('Bạn không có quyền truy cập trang quản trị.');
    }

    localStorage.setItem('admin_token', accessToken);
    localStorage.setItem('admin_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setToken(accessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setUser(null);
      setToken(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && user.role === 'admin',
        isLoading,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
