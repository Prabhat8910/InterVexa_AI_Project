import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
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
                }
                catch (err) {
                    console.error('[Auth] Token validation failed:', err);
                    logout();
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);
    const login = async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    };
    const registerUser = async (userData) => {
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
    return (<AuthContext.Provider value={{ user, token, loading, login, registerUser, logout }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside an AuthProvider');
    }
    return context;
};
