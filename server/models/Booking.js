import mongoose from 'mongoose';

/**
 * Booking Schema
 * Connects a registered User with an Event and specific Show session,
 * recording selected seats, pricing breakdown, transaction details, and digital pass metadata.
 */
const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user'],
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Booking must be associated with an event'],
      index: true,
    },
    showId: {
      type: String,
      default: '',
      index: true,
    },
    showDate: {
      type: Date,
    },
    showTime: {
      type: String,
      trim: true,
      default: '',
    },
    venue: {
      type: String,
      trim: true,
      default: '',
    },
    theatre: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    selectedSeats: {
      type: [String],
      required: [true, 'At least one seat must be selected'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'A booking must contain at least one seat',
      },
    },
    numberOfSeats: {
      type: Number,
      required: [true, 'Number of seats is required'],
      min: [1, 'Number of seats must be at least 1'],
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    convenienceFee: {
      type: Number,
      default: 0,
    },
    taxes: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount must be greater than or equal to 0'],
    },
    bookingReference: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    ticketId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    venueId: {
      type: String,
      default: '',
    },
    showtimeId: {
      type: String,
      default: '',
    },
    seatIds: {
      type: [String],
      default: [],
    },
    barcodeData: {
      type: String,
      default: '',
    },
    qrCodeData: {
      type: String,
      default: '',
    },
    ticketCategory: {
      type: String,
      default: 'Premium Gold',
      trim: true,
    },
    customerInfo: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    paymentMethod: {
      type: String,
      default: 'PhonePe UPI',
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    transactionId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    phonePeMerchantTxnId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    phonePeData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    holdExpiresAt: {
      type: Date,
      default: null,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['CONFIRMED', 'PENDING', 'CANCELLED', 'FAILED'],
        message: '{VALUE} is not a valid status.',
      },
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
