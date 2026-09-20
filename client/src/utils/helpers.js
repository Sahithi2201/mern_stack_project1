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

// Extract user-friendly error message from Axios error
export const getErrorMessage = (error) => {
  if (error.response) {
    // Backend returned a response outside 2xx range
    const status = error.response.status;
    const data = error.response.data;

    if (data && data.message) {
      return data.message;
    }
    if (status === 400) return 'Invalid request. Please verify your input.';
    if (status === 401) return 'Please login to continue.';
    if (status === 403) return 'You do not have permission to access this page.';
    if (status === 404) return 'The requested resource was not found.';
    if (status >= 500) return 'Server error. Please try again later.';
  } else if (error.request) {
    // Request was made but no response received
    return 'Unable to connect to the server. Please check your network or server.';
  }
  return error.message || 'An unexpected error occurred.';
};
