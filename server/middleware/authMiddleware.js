import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * Protects private endpoints by verifying the incoming JWT Bearer token
 */
export const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and begins with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from 'Bearer <token>'
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const secret = process.env.JWT_SECRET || 'tixora-secret-key-development-fallback';
      const decoded = jwt.verify(token, secret);

      // Find user by ID (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          message: 'Not authorized. User no longer exists.',
        });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        message: 'Not authorized. Please login.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: 'Not authorized. Please login.',
    });
  }
};

export default protect;
