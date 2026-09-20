/**
 * Tixora Admin Configuration & Role Authorization Allowlist
 * 
 * CRITICAL SECURITY DIRECTIVE:
 * ONLY THESE TWO email addresses can EVER receive ADMIN privileges:
 * 1. vu.241fa04491@gmail.com
 * 2. sahithi@2201
 * 
 * Every other email is strictly assigned the USER role.
 * Role decisions MUST be made exclusively by the server.
 */

const STRICT_ADMIN_EMAILS = [
  'vu.241fa04491@gmail.com',
  'sahithi@2201',
];

/**
 * Returns the list of authorized admin emails in normalized (lowercase, trimmed) form.
 * STRICT DIRECTIVE: ONLY these two emails can EVER receive admin privileges.
 */
export const getAdminEmails = () => {
  return STRICT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase());
};

/**
 * Normalizes an email:
 * 1. Trims leading and trailing whitespace
 * 2. Converts to lowercase for case-insensitive comparisons
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Checks if a given email is one of the two authorized admin emails.
 * Performs case-insensitive matching against normalized allowlist.
 */
export const isAuthorizedAdminEmail = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const adminList = getAdminEmails();
  return adminList.includes(normalized);
};

/**
 * Backend-enforced role determination.
 * NEVER trusts roles provided from the frontend.
 */
export const determineUserRole = (email) => {
  return isAuthorizedAdminEmail(email) ? 'admin' : 'user';
};

export default {
  getAdminEmails,
  normalizeEmail,
  isAuthorizedAdminEmail,
  determineUserRole,
};
