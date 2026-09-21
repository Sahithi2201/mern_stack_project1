import api from './api';

/**
 * Initiates a PhonePe payment session
 * @param {Object} data - { eventId, showId, selectedSeats, customerInfo, ticketCategory, paymentMethod }
 */
export const initiatePhonePePayment = async (data) => {
  const response = await api.post('/payments/phonepe/initiate', data);
  return response.data;
};

/**
 * Verifies PhonePe payment status strictly with backend
 * @param {Object} data - { merchantTransactionId, simulationAction }
 */
export const verifyPhonePePayment = async (data) => {
  const response = await api.post('/payments/phonepe/verify', data);
  return response.data;
};

/**
 * Gets payment record status
 * @param {string} merchantTransactionId
 */
export const getPaymentStatus = async (merchantTransactionId) => {
  const response = await api.get(`/payments/phonepe/status/${merchantTransactionId}`);
  return response.data;
};

export default {
  initiatePhonePePayment,
  verifyPhonePePayment,
  getPaymentStatus,
};
