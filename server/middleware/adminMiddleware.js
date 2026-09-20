/**
 * Admin Authorization Middleware
 * Verifies that the authenticated user possesses administrative privileges
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      message: 'Access denied. Admin privileges required.',
    });
  }
};

export default admin;
