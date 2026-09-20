import express from 'express';
import { getUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Admin-only route to view registered users
router.route('/')
  .get(protect, admin, getUsers);

export default router;
