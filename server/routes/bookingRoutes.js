import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  holdSeats,
  releaseSeats,
  verifyTicket,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// 1. Ticket Verification endpoints (Declared before /:id)
router.get('/verify-ticket/:ticketId', verifyTicket);
router.post('/verify-ticket', verifyTicket);

// 2. Create a booking (Authenticated users)
router.post('/', protect, createBooking);

// 2. Real-time temporary seat hold (10 minutes)
router.post('/hold-seats', protect, holdSeats);

// 3. Release held seats
router.post('/release-seats', protect, releaseSeats);

// 4. Get logged-in user's bookings (Declared BEFORE /:id to prevent route clash)
router.get('/my-bookings', protect, getMyBookings);

// 5. Admin: Get all bookings across all users and events
router.get('/', protect, admin, getAllBookings);

// 6. Get booking by ID (Owner or Admin)
router.get('/:id', protect, getBookingById);

// 7. Cancel a booking (Owner or Admin)
router.put('/:id/cancel', protect, cancelBooking);

export default router;
