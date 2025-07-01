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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = getCookie('auth_token');
      if (token) {
        try {
          const response = await api.get('/auth/users/me'); // This endpoint needs to be created
          setUser(response.data);
        } catch (error) {
          console.error("Failed to fetch user", error);
          deleteCookie('auth_token'); // Clear invalid token
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const login = (token: string, userData: User) => {
    setUser(userData);
    setCookie('auth_token', token, { maxAge: 60 * 60 * 24 * 7 }); // 7 days
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setUser(null);
    deleteCookie('auth_token');
    delete api.defaults.headers.common['Authorization'];
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