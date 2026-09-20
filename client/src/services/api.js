import axios from 'axios';

// Base API URL configured via environment variable with /api fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create a centralized Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: Automatically attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Extract clean user-friendly error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401 unauthorized, we could notify listeners or let caller handle it
    return Promise.reject(error);
  }
);

export default api;
