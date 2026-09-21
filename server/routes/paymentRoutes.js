import express from 'express';
import {
  initiatePayment,
  verifyPayment,
  getPaymentStatus,
  handlePhonePeCallback,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// PhonePe Payment Endpoints
router.post('/phonepe/initiate', protect, initiatePayment);
router.post('/phonepe/verify', protect, verifyPayment);
router.get('/phonepe/status/:merchantTransactionId', protect, getPaymentStatus);
router.post('/phonepe/callback', handlePhonePeCallback);

export default router;
