import mongoose from 'mongoose';

/**
 * Seat Subdocument Schema
 */
const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['AVAILABLE', 'BOOKED'],
        message: '{VALUE} is not a valid seat status. Must be AVAILABLE or BOOKED'
      },
      default: 'AVAILABLE',
    },
  },
  { _id: false }
);

/**
 * Event Schema
 * Represents movie screenings, concerts, conferences, and festivals.
 */
const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an event name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide an event description'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please specify an event category'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide the event venue or location'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Please provide the event date'],
    },
    time: {
      type: String,
      required: [true, 'Please provide the event start time'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide the ticket price'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Please provide the total number of seats'],
      min: [1, 'Total seats must be at least 1'],
    },
    availableSeats: {
      type: Number,
      required: [true, 'Please provide available seats count'],
      min: [0, 'Available seats cannot be negative'],
    },
    image: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    venue: {
      type: String,
      trim: true,
      default: '',
    },
    language: {
      type: String,
      trim: true,
      default: '',
    },
    duration: {
      type: String,
      trim: true,
      default: '',
    },
    genre: {
      type: String,
      trim: true,
      default: '',
    },
    seats: [seatSchema],
  },
  {
    timestamps: true,
  }
);

// Helpful compound and individual indexes for searching and filtering events
eventSchema.index(
  { name: 'text', description: 'text', location: 'text', city: 'text' },
  { default_language: 'none', language_override: 'none' }
);
eventSchema.index({ category: 1 });
eventSchema.index({ location: 1 });
eventSchema.index({ city: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ price: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
