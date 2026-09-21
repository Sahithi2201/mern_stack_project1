import axios from 'axios';

/**
 * Resolves the backend API base URL.
 * Automatically handles:
 * - Production / Dev unified port (defaults to '/api')
 * - Custom VITE_API_URL if configured with http://, https://, or /
 * - Rejects non-URL placeholders (like 'ticket' from env templates) and safely falls back to '/api'
 * - Appends '/api' if an origin URL like 'http://localhost:5000' is passed without '/api'
 */
const resolveApiBaseUrl = () => {
  // In the browser, the frontend is served from the same Express origin (or reverse proxy),
  // so relative '/api' is always the most robust, immune to host/port mismatches and mixed-content issues.
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string') {
    return '/api';
  }
  const trimmed = envUrl.trim();
  // Reject placeholders like 'ticket' or 'undefined'
  if (!trimmed || trimmed === 'ticket' || trimmed === 'undefined' || trimmed === 'null') {
    return '/api';
  }
  // If in browser and pointing to a different host/port that might be blocked by CORS or mixed-content, prefer relative /api
  if (typeof window !== 'undefined' && window.location) {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.origin !== window.location.origin) {
          return '/api';
        }
      } catch {
        return '/api';
      }
    }
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
    return '/api';
  }
  const clean = trimmed.replace(/\/+$/, '');
  if ((clean.startsWith('http://') || clean.startsWith('https://')) && !clean.endsWith('/api')) {
    return `${clean}/api`;
  }
  return clean || '/api';
};

const API_BASE_URL = resolveApiBaseUrl();

// Create a centralized Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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
