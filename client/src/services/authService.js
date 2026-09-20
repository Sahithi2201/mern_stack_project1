import api from './api.js';

/**
 * Authentication Service
 * Handles user registration, login, profile retrieval, OTP flows, and Google auth
 */

// Register a new user account
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Log in an existing user with password
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// Send OTP code to email
export const sendOtp = async (email) => {
  const response = await api.post('/auth/send-otp', { email });
  return response.data;
};

// Verify OTP code and authenticate
export const verifyOtp = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

// Google Sign-In authentication
export const googleSignIn = async (googleData) => {
  const response = await api.post('/auth/google', googleData);
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
  sendOtp,
  verifyOtp,
  googleSignIn,
  getCurrentUser,
  logoutUser,
};
