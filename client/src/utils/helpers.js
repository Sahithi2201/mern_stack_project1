/**
 * Helper utilities for formatting and data display
 */

// Format numbers into Indian Rupees (INR) format (e.g., ₹250)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format ISO date string into readable Indian format (e.g., 15 Oct 2026)
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Helper to sanitize raw code/engine errors and return clean user-facing copy
const sanitizeErrorMessage = (msg) => {
  if (!msg || typeof msg !== 'string') return '';
  const isTechnical =
    /is not a function/i.test(msg) ||
    /typeerror/i.test(msg) ||
    /referenceerror/i.test(msg) ||
    /syntaxerror/i.test(msg) ||
    /cannot read propert/i.test(msg) ||
    /undefined/i.test(msg) ||
    /\[object object\]/i.test(msg) ||
    /cast to objectid/i.test(msg) ||
    /at\s+[\w$./\\-]+\s+\(/i.test(msg) ||
    /validation failed/i.test(msg);

  if (isTechnical) {
    return 'Unable to complete your request. Please try again.';
  }
  return msg;
};

// Extract user-friendly error message from Axios error
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';

  if (error.response) {
    // Backend returned an HTTP response outside 2xx range
    const status = error.response.status;
    const data = error.response.data;

    if (data) {
      if (typeof data === 'string' && data.length < 200 && !data.includes('<!DOCTYPE')) {
        const sanitized = sanitizeErrorMessage(data);
        if (sanitized) return sanitized;
      }
      if (data.message && typeof data.message === 'string') {
        const sanitized = sanitizeErrorMessage(data.message);
        if (sanitized) return sanitized;
      }
      if (data.error && typeof data.error === 'string') {
        const sanitized = sanitizeErrorMessage(data.error);
        if (sanitized) return sanitized;
      }
    }
    if (status === 400) return 'Please check your inputs and try again.';
    if (status === 401) return 'Session expired or incorrect credentials. Please log in.';
    if (status === 403) return 'You do not have permission to access this page.';
    if (status === 404) return 'The requested resource was not found.';
    if (status === 409) return 'This seat or resource is no longer available. Please select another.';
    if (status === 422) return 'Please check your inputs and try again.';
    if (status >= 500) return 'Unable to process request right now. Please try again.';
  } else if (error.request) {
    // Request was made but no response received (network error / backend unavailable)
    return 'Unable to connect to the booking service right now. Please try again.';
  }
  return sanitizeErrorMessage(error.message) || 'An unexpected error occurred. Please try again.';
};
