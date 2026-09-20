/**
 * Client-side validation helpers
 */

// Validate email format
export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Validate password (min 6 characters)
export const validatePassword = (password) => {
  return typeof password === 'string' && password.trim().length >= 6;
};

// Validate non-empty required fields
export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};
