import User from '../models/User.js';

/**
 * @desc    Get all registered users (Admin only)
 * @route   GET /api/users
 * @access  Private / Admin
 */
export const getUsers = async (req, res, next) => {
  try {
    // Only return safe fields: _id, name, email, role, createdAt
    // Never return password, passwordHash, or tokens
    const users = await User.find({})
      .select('_id name email role createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export default {
  getUsers,
};
