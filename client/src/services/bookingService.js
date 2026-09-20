import api from './api.js';

/**
 * Booking Management Service
 * Communicates with backend ticket booking, cancellation, and retrieval endpoints
 */

// Create a new booking with selected seats
export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

// Retrieve booking history for the logged-in user
export const getMyBookings = async () => {
  const response = await api.get('/bookings/my-bookings');
  return response.data;
};

// Retrieve single booking details by ID (Owner or Admin)
export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

// Cancel a booking and release seats back to available (Owner or Admin)
export const cancelBooking = async (id) => {
  const response = await api.put(`/bookings/${id}/cancel`);
  return response.data;
};

// Retrieve all platform bookings (Admin only)
export const getAllBookings = async (params = {}) => {
  const response = await api.get('/bookings', { params });
  return response.data;
};

export default {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
};
