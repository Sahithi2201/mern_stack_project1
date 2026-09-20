import api from './api.js';

/**
 * User Management Service
 * Communicates with backend user retrieval endpoints (Admin only)
 */

// Retrieve all registered users (Admin only)
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export default {
  getUsers,
};
