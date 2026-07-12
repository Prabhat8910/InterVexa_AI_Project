import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'recruiter' | 'university' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  registerUser: (userData: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        
        try {
          // Verify token against server
          const response = await api.get('/auth/me');
          if (response.data.user) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        } catch (err) {
          console.error('[Auth] Token validation failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;
    
    setToken(token);
    setUser(user);
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const registerUser = async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    const { token, user } = response.data;
    
    setToken(token);
    setUser(user);
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
