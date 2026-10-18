import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getSavedUser,
  getAuthToken,
  saveUser,
  setAuthToken,
  removeAuthToken,
  loginUser,
  registerUser,
  getMe
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser());
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const freshUser = await getMe();
          setUser(freshUser);
          saveUser(freshUser);
        } catch (err) {
          console.warn('Session expired or invalid, logging out:', err.message);
          removeAuthToken();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    setAuthToken(res.token);
    saveUser(res);
    setToken(res.token);
    setUser(res);
    return res;
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    setAuthToken(res.token);
    saveUser(res);
    setToken(res.token);
    setUser(res);
    return res;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
