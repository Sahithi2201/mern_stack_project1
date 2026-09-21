import mongoose from 'mongoose';

/**
 * Ticket Schema
 * Represents the official verifiable digital pass issued upon confirmed payment.
 * Links to Booking, User, and Event records with cryptographically verifiable payload.
 */
const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
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
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    venueId: {
      type: String,
      default: '',
    },
    showtimeId: {
      type: String,
      default: '',
    },
    venue: {
      type: String,
      default: '',
    },
    showDate: {
      type: Date,
    },
    showTime: {
      type: String,
      default: '',
    },
    seats: {
      type: [String],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'FAILED', 'REFUNDED'],
      default: 'PAID',
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: ['CONFIRMED', 'PENDING', 'CANCELLED', 'FAILED'],
      default: 'CONFIRMED',
      index: true,
    },
    verificationPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    barcodeData: {
      type: String,
      default: '',
    },
    qrCodeData: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
