import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('noball_token');
    if (token) {
      api.get('/auth/me')
        .then(data => setUser(data))
        .catch(() => localStorage.removeItem('noball_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (loginStr, password) => {
    const { token, user: userData } = await api.post('/auth/login', { login: loginStr, password });
    localStorage.setItem('noball_token', token);
    setUser(userData);
    return userData;
  };

  const register = async (username, email, password, displayName) => {
    const { token, user: userData } = await api.post('/auth/register', {
      username, email, password, displayName,
    });
    localStorage.setItem('noball_token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('noball_token');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const updated = await api.put('/auth/me', data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
