import api from './api.js';

/**
 * Event Management Service
 * Communicates with backend event CRUD, search, filter, and seat reset endpoints
 */

// Get events with optional query parameters (search, category, location, date, sort, page, limit)
export const getEvents = async (params = {}) => {
  const response = await api.get('/events', { params });
  return response.data;
};

// Get single event details by its MongoDB ID
export const getEventById = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

// Create a new event (Admin only)
export const createEvent = async (eventData) => {
  const response = await api.post('/events', eventData);
  return response.data;
};

// Update an existing event (Admin only)
export const updateEvent = async (id, eventData) => {
  const response = await api.put(`/events/${id}`, eventData);
  return response.data;
};

// Delete an event (Admin only)
export const deleteEvent = async (id) => {
  const response = await api.delete(`/events/${id}`);
  return response.data;
};

// Reset all seats to AVAILABLE for an event (Admin only)
export const resetEventSeats = async (id) => {
  const response = await api.post(`/events/${id}/reset-seats`);
  return response.data;
};

export default {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  resetEventSeats,
};
