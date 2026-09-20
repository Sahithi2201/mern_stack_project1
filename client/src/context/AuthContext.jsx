import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService.js';
import { getErrorMessage } from '../utils/helpers.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on app mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, expired, or malformed
          console.warn('Session expired or invalid token:', error.message);
          authService.logoutUser();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (credentials) => {
    try {
      const data = await authService.loginUser(credentials);
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error('No token returned from server');
    } catch (error) {
      const friendlyMessage = getErrorMessage(error);
      return { success: false, error: friendlyMessage };
    }
  };

  // Register handler with automatic login
  const register = async (userData) => {
    try {
      const data = await authService.registerUser(userData);
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: true, message: data.message };
    } catch (error) {
      const friendlyMessage = getErrorMessage(error);
      return { success: false, error: friendlyMessage };
    }
  };

  // Logout handler
  const logout = () => {
    authService.logoutUser();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to consume AuthContext cleanly in any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
