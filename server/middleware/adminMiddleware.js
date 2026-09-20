import { isAuthorizedAdminEmail } from '../config/adminConfig.js';

/**
 * Admin Authorization Middleware
 * Verifies that the authenticated user possesses administrative privileges.
 * Strictly verifies against the authorized ADMIN_EMAILS allowlist on the backend.
 * Rejects any normal user or unauthorized email with HTTP 403.
 */
export const admin = (req, res, next) => {
  if (
    req.user &&
    req.user.role === 'admin' &&
    isAuthorizedAdminEmail(req.user.email)
  ) {
    return next();
  }

  return res.status(403).json({
    message: 'Access denied. Admin privileges required.',
  });
};

export default admin;

