import mongoose from 'mongoose';

/**
 * Payment Schema
 * Tracks payment transactions initiated via PhonePe payment gateway.
 */
const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    merchantTransactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phonePeTransactionId: {
      type: String,
      default: '',
      index: true,
    },
    provider: {
      type: String,
      default: 'PHONEPE',
    },
    paymentInstrument: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    responseCode: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
