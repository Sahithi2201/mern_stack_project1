import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// 1. Create a booking (Authenticated users)
router.post('/', protect, createBooking);

// 2. Get logged-in user's bookings (Declared BEFORE /:id to prevent route clash)
router.get('/my-bookings', protect, getMyBookings);

// 3. Admin: Get all bookings across all users and events
router.get('/', protect, admin, getAllBookings);

// 4. Get booking by ID (Owner or Admin)
router.get('/:id', protect, getBookingById);

// 5. Cancel a booking (Owner or Admin)
router.put('/:id/cancel', protect, cancelBooking);

export default router;
