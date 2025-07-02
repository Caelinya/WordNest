"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import { User } from '@/types/notes';
import api from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
    initialUser?: User | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser); // Only loading if no initial user

  useEffect(() => {
    // If we have an initial user, we don't need to fetch on mount.
    if (initialUser) return;

    const fetchUser = async () => {
      const token = getCookie('auth_token');
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/auth/users/me');
          setUser(response.data);
        } catch (error) {
          console.error("Failed to fetch user", error);
          deleteCookie('auth_token'); // Clear invalid token
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [initialUser]);

  const login = (token: string, userData: User) => {
    setUser(userData);
    setCookie('auth_token', token, { maxAge: 60 * 60 * 24 * 7 }); // 7 days
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setUser(null);
    deleteCookie('auth_token');
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/'; // Force a reload to the home page
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}