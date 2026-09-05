'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export type UserRole = 'EMPLOYEE' | 'HR_MANAGER' | 'HR_PAYROLL_USER' | 'HR_PAYROLL_MANAGER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber?: string | null;
    avatarUrl?: string | null;
  } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  hasMinRole: (minRole: UserRole) => boolean;
}

const ROLE_LEVELS: Record<UserRole, number> = {
  EMPLOYEE: 1,
  HR_MANAGER: 2,
  HR_PAYROLL_USER: 3,
  HR_PAYROLL_MANAGER: 4,
  ADMIN: 5,
};

const TOKEN_KEY = 'pp360_token';
const USER_KEY = 'pp360_user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient<{ success: boolean; data: { token: string; user: AuthUser } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );

    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const hasMinRole = useCallback(
    (minRole: UserRole) => {
      if (!user) return false;
      return ROLE_LEVELS[user.role] >= ROLE_LEVELS[minRole];
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        hasRole,
        hasMinRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
