import mongoose from 'mongoose';

/**
 * Booking Schema
 * Connects a registered User with an Event, recording selected seats and calculated total.
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
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount must be greater than or equal to 0'],
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['CONFIRMED', 'CANCELLED'],
        message: '{VALUE} is not a valid status. Allowed values are "CONFIRMED" or "CANCELLED"'
      },
      default: 'CONFIRMED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
