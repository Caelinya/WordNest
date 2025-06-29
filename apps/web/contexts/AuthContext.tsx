"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkStoredToken = async () => {
      // getCookie can be async, so we await it
      const storedToken = await getCookie('auth_token');
      if (typeof storedToken === 'string') {
        setToken(storedToken);
      }
    };
    checkStoredToken();
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    setCookie('auth_token', newToken, { maxAge: 60 * 60 * 24 * 7 }); // 7 days
  };

  const logout = () => {
    setToken(null);
    deleteCookie('auth_token');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, login, logout }}>
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