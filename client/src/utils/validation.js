/**
 * Client-side validation helpers
 */

// Validate email format (supports standard email and local-domain formats like sahithi@2201)
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (!trimmed) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$/;
  return emailRegex.test(trimmed);
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
