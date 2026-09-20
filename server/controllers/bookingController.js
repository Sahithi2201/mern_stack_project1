import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';

// Helper to check if the current MongoDB connection supports multi-document transactions
const supportsTransactions = () => {
  const type = mongoose.connection?.client?.topology?.description?.type;
  return type === 'ReplicaSetWithPrimary' || type === 'Sharded';
};

/**
 * @desc    Create a new ticket booking
 * @route   POST /api/bookings
 * @access  Private (Authenticated users)
 */
export const createBooking = async (req, res, next) => {
  const { eventId, selectedSeats } = req.body;
  const userId = req.user._id;

  // 1. Validate event ID format
  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({
      message: 'Invalid or missing Event ID',
    });
  }

  // 2. Validate selectedSeats array
  if (!selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    return res.status(400).json({
      message: 'Please select at least one seat',
    });
  }

  // 3. Check for duplicate seats in request
  const uniqueSeats = new Set(selectedSeats);
  if (uniqueSeats.size !== selectedSeats.length) {
    return res.status(400).json({
      message: 'Duplicate seats are not allowed.',
    });
  }

  // Attempt transaction only if supported (ReplicaSet / Sharded cluster)
  let session = null;
  let useTransaction = false;

  if (supportsTransactions()) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch (sessionErr) {
      session = null;
      useTransaction = false;
    }
  }

  try {
    // Find the event (using session if active)
    const eventQuery = Event.findById(eventId);
    if (useTransaction && session) {
      eventQuery.session(session);
    }
    const event = await eventQuery;

    if (!event) {
      if (useTransaction && session) await session.abortTransaction();
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    // 4. Validate that all selected seats exist in the event and are AVAILABLE
    const seatMap = new Map();
    event.seats.forEach((s) => {
      seatMap.set(s.seatNumber, s);
    });

    for (const seatNumber of selectedSeats) {
      const seat = seatMap.get(seatNumber);
      if (!seat) {
        if (useTransaction && session) await session.abortTransaction();
        return res.status(400).json({
          message: `Invalid seat selected: ${seatNumber}`,
        });
      }

      if (seat.status !== 'AVAILABLE') {
        if (useTransaction && session) await session.abortTransaction();
        return res.status(400).json({
          message: 'One or more selected seats are no longer available.',
        });
      }
    }

    // 5. Verify enough seats available
    const numberOfSeats = selectedSeats.length;
    if (event.availableSeats < numberOfSeats) {
      if (useTransaction && session) await session.abortTransaction();
      return res.status(400).json({
        message: 'Not enough available seats for this event',
      });
    }

    // 6. Calculate total amount strictly on the backend
    const totalAmount = numberOfSeats * event.price;

    // 7. Mark selected seats as BOOKED and decrement availableSeats
    event.seats.forEach((s) => {
      if (uniqueSeats.has(s.seatNumber)) {
        s.status = 'BOOKED';
      }
    });
    event.availableSeats -= numberOfSeats;

    // Save event update
    if (useTransaction && session) {
      await event.save({ session });
    } else {
      await event.save();
    }

    // 8. Create the Booking document
    let booking;
    if (useTransaction && session) {
      const createdBookings = await Booking.create(
        [
          {
            user: userId,
            event: eventId,
            selectedSeats,
            numberOfSeats,
            totalAmount,
            status: 'CONFIRMED',
          },
        ],
        { session }
      );
      booking = createdBookings[0];
      await session.commitTransaction();
    } else {
      booking = await Booking.create({
        user: userId,
        event: eventId,
        selectedSeats,
        numberOfSeats,
        totalAmount,
        status: 'CONFIRMED',
      });
    }

    // Populate event details for response
    await booking.populate('event', 'name location date time price image');

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        _id: booking._id,
        user: booking.user,
        event: booking.event,
        selectedSeats: booking.selectedSeats,
        numberOfSeats: booking.numberOfSeats,
        totalAmount: booking.totalAmount,
        bookingDate: booking.bookingDate,
        status: booking.status,
      },
    });
  } catch (error) {
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // ignore abort error
      }
    }
    next(error);
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * @desc    Get bookings of the logged-in user
 * @route   GET /api/bookings/my-bookings
 * @access  Private (Authenticated users)
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'name location date time price image category')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private (Owner or Admin)
 */
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid Booking ID format',
      });
    }

    const booking = await Booking.findById(id)
      .populate('user', 'name email role')
      .populate('event', 'name description location date time price image category');

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found',
      });
    }

    // Authorization check: User can only view their own booking unless they are admin
    const isOwner = booking.user && booking.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own bookings.',
      });
    }

    return res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a confirmed booking and release seats back to AVAILABLE
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (Owner or Admin)
 */
export const cancelBooking = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Invalid Booking ID format',
    });
  }

  // Session for transaction support (only if supported by MongoDB topology)
  let session = null;
  let useTransaction = false;

  if (supportsTransactions()) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch (err) {
      session = null;
      useTransaction = false;
    }
  }

  try {
    const bookingQuery = Booking.findById(id);
    if (useTransaction && session) {
      bookingQuery.session(session);
    }
    const booking = await bookingQuery;

    if (!booking) {
      if (useTransaction && session) await session.abortTransaction();
      return res.status(404).json({
        message: 'Booking not found',
      });
    }

    // Check authorization: Must be owner or admin
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      if (useTransaction && session) await session.abortTransaction();
      return res.status(403).json({
        message: 'Access denied. You can only cancel your own bookings.',
      });
    }

    // Check if already cancelled
    if (booking.status === 'CANCELLED') {
      if (useTransaction && session) await session.abortTransaction();
      return res.status(400).json({
        message: 'This booking has already been cancelled.',
      });
    }

    // Find the associated event
    const eventQuery = Event.findById(booking.event);
    if (useTransaction && session) {
      eventQuery.session(session);
    }
    const event = await eventQuery;

    if (event) {
      const seatsToRelease = new Set(booking.selectedSeats);

      // Revert booked seats to AVAILABLE
      event.seats.forEach((seat) => {
        if (seatsToRelease.has(seat.seatNumber)) {
          seat.status = 'AVAILABLE';
        }
      });

      // Increase availableSeats count
      event.availableSeats += booking.numberOfSeats;

      if (useTransaction && session) {
        await event.save({ session });
      } else {
        await event.save();
      }
    }

    // Mark booking status as CANCELLED
    booking.status = 'CANCELLED';

    if (useTransaction && session) {
      await booking.save({ session });
      await session.commitTransaction();
    } else {
      await booking.save();
    }

    return res.status(200).json({
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
      } catch (e) {
        // ignore
      }
    }
    next(error);
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * @desc    Get all bookings with optional filtering (Admin only)
 * @route   GET /api/bookings
 * @access  Private / Admin
 */
export const getAllBookings = async (req, res, next) => {
  try {
    const { status, eventId, userId } = req.query;

    const filter = {};

    if (status && status.trim() !== '') {
      filter.status = status.toUpperCase().trim();
    }

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.event = eventId;
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.user = userId;
    }

    const bookings = await Booking.find(filter)
      .populate('user', 'name email role')
      .populate('event', 'name location date time price category')
      .sort({ createdAt: -1 })
      .lean();

    // Compute basic statistics for admin overview
    const totalBookings = bookings.length;
    const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;
    const totalRevenue = bookings
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return res.status(200).json({
      bookings,
      stats: {
        totalBookings,
        confirmedCount,
        cancelledCount,
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};
