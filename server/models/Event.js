import mongoose from 'mongoose';

/**
 * Seat Subdocument Schema
 */
export const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['AVAILABLE', 'HELD', 'BOOKED'],
        message: '{VALUE} is not a valid seat status. Must be AVAILABLE, HELD, or BOOKED',
      },
      default: 'AVAILABLE',
    },
    tier: {
      type: String,
      enum: ['VIP', 'Premium', 'Regular'],
      default: 'Regular',
    },
    price: {
      type: Number,
      default: 0,
    },
    heldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    holdExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

/**
 * Show Session Subdocument Schema
 * Represents a specific date/time session for this event at a venue.
 * Scoped seat inventory guarantees that booking a seat for 24 Sept 18:30 does NOT lock it for 25 Sept.
 */
export const showSessionSchema = new mongoose.Schema(
  {
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
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalSeats: {
      type: Number,
      default: 60,
    },
    availableSeats: {
      type: Number,
      default: 60,
    },
    seats: [seatSchema],
  },
  { timestamps: true }
);

/**
 * Event Schema
 * Represents movie screenings, concerts, sports tournaments, theatre, and festivals.
 */
const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an event name'],
      trim: true,
    },
    title: {
      type: String,
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
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Please provide the event date'],
      index: true,
    },
    time: {
      type: String,
      required: [true, 'Please provide the event start time'],
      trim: true,
    },
    startTime: {
      type: String,
      trim: true,
      default: '',
    },
    endTime: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Please provide the ticket price'],
      min: [0, 'Price must be greater than or equal to 0'],
      index: true,
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
    backgroundImage: {
      type: String,
      default: '',
    },
    heroImage: {
      type: String,
      default: '',
    },
    posterImage: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      trim: true,
      default: '',
      index: true,
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
    certificate: {
      type: String,
      trim: true,
      default: 'U/A',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'UPCOMING', 'CANCELLED', 'COMPLETED'],
      default: 'ACTIVE',
    },
    seatLayout: {
      type: String,
      enum: ['STANDARD', 'CINEMA', 'STADIUM', 'CONCERT_ARENA', 'THEATRE'],
      default: 'STANDARD',
    },
    seats: [seatSchema],
    shows: [showSessionSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias 'title' matching 'name'
eventSchema.pre('save', function (next) {
  if (!this.title && this.name) {
    this.title = this.name;
  }
  if (!this.startTime && this.time) {
    this.startTime = this.time;
  }
  if (!this.venue && this.location) {
    this.venue = this.location;
  }
  if (!this.posterImage && this.image) {
    this.posterImage = this.image;
  }
  if (typeof next === 'function') {
    next();
  }
});

// Indexes for searching and filtering
eventSchema.index(
  { name: 'text', description: 'text', location: 'text', city: 'text', language: 'text' },
  { default_language: 'none', language_override: 'none' }
);
eventSchema.index({ category: 1 });
eventSchema.index({ city: 1, category: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
