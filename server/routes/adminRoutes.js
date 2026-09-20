import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Enforce authentication AND admin role for all routes in /api/admin
router.use(protect, admin);

/**
 * @desc    Get Admin Overview & System Metrics
 * @route   GET /api/admin/overview
 * @access  Private/Admin
 */
router.get('/overview', async (req, res, next) => {
  try {
    const [totalUsers, totalEvents, totalBookings, bookings] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Booking.countDocuments(),
      Booking.find({ status: 'confirmed' }),
    ]);

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return res.status(200).json({
      metrics: {
        totalUsers,
        totalEvents,
        totalBookings,
        totalRevenue,
      },
      currentAdmin: {
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get Admin Analytics
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalBookings = await Booking.countDocuments();

    return res.status(200).json({
      analytics: {
        users: totalUsers,
        events: totalEvents,
        bookings: totalBookings,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Verify Admin Access
 * @route   GET /api/admin/status
 * @access  Private/Admin
 */
router.get('/status', (req, res) => {
  return res.status(200).json({
    status: 'authorized',
    role: req.user.role,
    email: req.user.email,
  });
});

export default router;
