import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  sendOtp,
  verifyOtp,
  googleAuth,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/google', googleAuth);

// Protected session route
router.get('/me', protect, getCurrentUser);

export default router;
