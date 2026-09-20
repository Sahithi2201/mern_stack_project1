import api from './api.js';

/**
 * Authentication Service
 * Handles user registration, login, profile retrieval, and token management
 */

// Register a new user account
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Log in an existing user
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// Retrieve currently authenticated user profile
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Log out user by removing token from local storage
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
};
