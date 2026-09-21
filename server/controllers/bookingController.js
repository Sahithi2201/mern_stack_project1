import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import Ticket from '../models/Ticket.js';
import { broadcastSeatUpdate, broadcastNewBooking } from '../socket.js';

// Helper to check if the current MongoDB connection supports multi-document transactions
const supportsTransactions = () => {
  const type = mongoose.connection?.client?.topology?.description?.type;
  return type === 'ReplicaSetWithPrimary' || type === 'Sharded';
};

/**
 * Generate a unique professional booking reference (e.g. TXR-2026-8F4K92)
 */
const generateBookingReference = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TXR-${new Date().getFullYear()}-${code}`;
};

/**
 * Generate unique ticket ID (TIX-2026-XXXXXX)
 */
const generateTicketId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TIX-${new Date().getFullYear()}-${rand}`;
};

/**
 * @desc    Create a new ticket booking
 * @route   POST /api/bookings
 * @access  Private (Authenticated users)
 */
export const createBooking = async (req, res, next) => {
  const {
    eventId,
    selectedSeats,
    customerInfo,
    paymentMethod = 'UPI / Card',
    ticketCategory = 'Gold Pass',
  } = req.body;
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

    // 6. Calculate pricing strictly on backend
    const subtotal = numberOfSeats * event.price;
    const convenienceFee = Math.round(subtotal * 0.05) || 40; // 5% convenience fee
    const taxes = Math.round(convenienceFee * 0.18); // 18% GST on convenience fee
    const totalAmount = subtotal + convenienceFee + taxes;

    // Generate unique booking reference
    const bookingReference = generateBookingReference();

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

    // Customer info defaults
    const resolvedCustomerInfo = {
      name: customerInfo?.name || req.user.name || 'Valued Guest',
      email: customerInfo?.email || req.user.email || '',
      phone: customerInfo?.phone || '',
    };

    // 8. Create the Booking document
    const bookingPayload = {
      user: userId,
      event: eventId,
      selectedSeats,
      numberOfSeats,
      subtotal,
      convenienceFee,
      taxes,
      totalAmount,
      bookingReference,
      ticketCategory,
      customerInfo: resolvedCustomerInfo,
      paymentMethod,
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
    };

    let booking;
    if (useTransaction && session) {
      const createdBookings = await Booking.create([bookingPayload], { session });
      booking = createdBookings[0];
      await session.commitTransaction();
    } else {
      booking = await Booking.create(bookingPayload);
    }

    // Populate event details for response
    await booking.populate('event', 'name title description location venue city date time price image backgroundImage heroImage category duration language');

    // Real-time notifications
    if (booking.status === 'CONFIRMED') {
      broadcastSeatUpdate({
        eventId: eventId.toString(),
        showId: booking.showId || '',
        seats: selectedSeats,
        status: 'BOOKED',
      });
      broadcastNewBooking(booking);
    }

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        _id: booking._id,
        bookingReference: booking.bookingReference,
        user: booking.user,
        event: booking.event,
        selectedSeats: booking.selectedSeats,
        numberOfSeats: booking.numberOfSeats,
        subtotal: booking.subtotal,
        convenienceFee: booking.convenienceFee,
        taxes: booking.taxes,
        totalAmount: booking.totalAmount,
        bookingDate: booking.bookingDate,
        ticketCategory: booking.ticketCategory,
        customerInfo: booking.customerInfo,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
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
      .populate('event', 'name title location venue city date time price image backgroundImage heroImage category')
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

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        message: 'Invalid Booking ID parameter',
      });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { bookingReference: id };

    const booking = await Booking.findOne(query)
      .populate('user', 'name email role')
      .populate('event', 'name title description location venue city date time price image backgroundImage heroImage category duration genre language');

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
      .populate('event', 'name title location venue city date time price image backgroundImage heroImage category')
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

/**
 * @desc    Hold seats temporarily (10 minutes) before payment
 * @route   POST /api/bookings/hold-seats
 * @access  Private
 */
export const holdSeats = async (req, res, next) => {
  try {
    const { eventId, showId, seats } = req.body;
    const userId = req.user._id;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Valid Event ID is required' });
    }
    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'Please select at least one seat to hold' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let seatPool = event.seats;
    if (showId && event.shows && event.shows.length > 0) {
      const targetShow = event.shows.id(showId);
      if (targetShow && targetShow.seats && targetShow.seats.length > 0) {
        seatPool = targetShow.seats;
      }
    }

    const now = new Date();
    const seatMap = new Map();
    seatPool.forEach((s) => seatMap.set(s.seatNumber, s));

    for (const seatNum of seats) {
      const s = seatMap.get(seatNum);
      if (!s) {
        return res.status(400).json({ message: `Seat ${seatNum} is invalid.` });
      }
      if (s.status === 'BOOKED') {
        return res.status(400).json({ message: `Seat ${seatNum} is already booked.` });
      }
      if (
        s.status === 'HELD' &&
        s.heldBy &&
        s.heldBy.toString() !== userId.toString() &&
        s.holdExpiresAt &&
        new Date(s.holdExpiresAt) > now
      ) {
        return res.status(400).json({
          message: `Seat ${seatNum} is currently held by another customer. Please choose another seat.`,
        });
      }
    }

    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    seats.forEach((seatNum) => {
      const s = seatMap.get(seatNum);
      if (s) {
        s.status = 'HELD';
        s.heldBy = userId;
        s.holdExpiresAt = holdExpiresAt;
      }
    });

    await event.save();

    broadcastSeatUpdate({
      eventId: eventId.toString(),
      showId: showId || '',
      seats,
      status: 'HELD',
      heldBy: userId.toString(),
      expiresAt: holdExpiresAt,
    });

    return res.status(200).json({
      success: true,
      message: 'Seats held successfully for 10 minutes',
      heldSeats: seats,
      holdExpiresAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Release held seats
 * @route   POST /api/bookings/release-seats
 * @access  Private
 */
export const releaseSeats = async (req, res, next) => {
  try {
    const { eventId, showId, seats } = req.body;
    const userId = req.user._id;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Valid Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let seatPool = event.seats;
    if (showId && event.shows && event.shows.length > 0) {
      const targetShow = event.shows.id(showId);
      if (targetShow && targetShow.seats && targetShow.seats.length > 0) {
        seatPool = targetShow.seats;
      }
    }

    const released = [];
    seatPool.forEach((s) => {
      if (
        (!seats || seats.includes(s.seatNumber)) &&
        s.status === 'HELD' &&
        (!s.heldBy || s.heldBy.toString() === userId.toString())
      ) {
        s.status = 'AVAILABLE';
        s.heldBy = null;
        s.holdExpiresAt = null;
        released.push(s.seatNumber);
      }
    });

    await event.save();

    if (released.length > 0) {
      broadcastSeatUpdate({
        eventId: eventId.toString(),
        showId: showId || '',
        seats: released,
        status: 'AVAILABLE',
      });
    }

    return res.status(200).json({
      success: true,
      releasedSeats: released,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify ticket by unique Ticket ID or Booking Reference
 * @route   GET /api/bookings/verify-ticket/:ticketId
 * @access  Public / Gate / Admin
 */
export const verifyTicket = async (req, res, next) => {
  try {
    const rawCode = (req.params.ticketId || req.body.ticketId || req.body.code || '').trim();
    if (!rawCode) {
      return res.status(400).json({
        verified: false,
        verificationStatus: 'INVALID',
        message: 'Ticket ID or verification code is required.',
      });
    }

    // 1. Look up Ticket or Booking
    let ticket = await Ticket.findOne({
      $or: [
        { ticketId: rawCode },
        { 'verificationPayload.ticketId': rawCode },
        { barcodeData: rawCode },
      ],
    }).populate('booking user event');

    let booking;
    if (ticket && ticket.booking) {
      booking = ticket.booking;
    } else {
      // Fallback search directly in Booking collection
      booking = await Booking.findOne({
        $or: [
          { ticketId: rawCode },
          { bookingReference: rawCode },
          ...(mongoose.Types.ObjectId.isValid(rawCode) ? [{ _id: rawCode }] : []),
        ],
      }).populate('user event');
    }

    if (!booking) {
      return res.status(404).json({
        verified: false,
        verificationStatus: 'INVALID',
        message: 'No ticket or reservation found matching this code.',
      });
    }

    const event = booking.event;
    const user = booking.user;

    // Requirement:
    // Only successfully paid bookings can display: VERIFIED
    // Unpaid, cancelled, expired, or invalid tickets must not be treated as valid tickets.
    const isPaid = booking.paymentStatus === 'PAID';
    const isConfirmed = booking.status === 'CONFIRMED';

    if (!isPaid || !isConfirmed) {
      const reasonStatus = booking.status === 'CANCELLED' ? 'CANCELLED' : 'UNPAID';
      return res.status(200).json({
        verified: false,
        verificationStatus: reasonStatus,
        message: `This ticket is ${reasonStatus}. Only successfully paid and confirmed reservations are valid passes.`,
        ticketId: booking.ticketId || ticket?.ticketId || booking.bookingReference,
        bookingReference: booking.bookingReference,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.status,
        event: event
          ? {
              name: event.name || event.title,
              category: event.category,
              venue: booking.venue || event.venue || event.location,
              city: booking.city || event.city,
              date: booking.showDate || event.date,
              time: booking.showTime || event.time,
            }
          : null,
        user: {
          name: user?.name || booking.customerInfo?.name || 'Customer',
          email: user?.email || booking.customerInfo?.email || '',
        },
        selectedSeats: booking.selectedSeats || [],
      });
    }

    // Fully paid & confirmed ticket
    return res.status(200).json({
      verified: true,
      verificationStatus: 'VERIFIED',
      message: 'Official TIXORA Digital Pass Verified',
      ticketId: booking.ticketId || ticket?.ticketId || booking.bookingReference,
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      event: {
        id: event?._id,
        name: event?.name || event?.title || 'Event Reservation',
        category: event?.category || 'Live Event',
        venue: booking.venue || event?.venue || event?.location || 'Venue',
        city: booking.city || event?.city || '',
        date: booking.showDate || event?.date,
        time: booking.showTime || event?.time || '',
        image: event?.image || event?.posterImage,
        backgroundImage: event?.backgroundImage || event?.heroImage,
      },
      user: {
        id: user?._id,
        name: user?.name || booking.customerInfo?.name || 'Valued Guest',
        email: user?.email || booking.customerInfo?.email || '',
        phone: user?.phoneNumber || booking.customerInfo?.phone || '',
      },
      selectedSeats: booking.selectedSeats || [],
      numberOfSeats: booking.numberOfSeats || booking.selectedSeats?.length || 1,
      totalAmount: booking.totalAmount,
      subtotal: booking.subtotal,
      convenienceFee: booking.convenienceFee,
      taxes: booking.taxes,
      ticketCategory: booking.ticketCategory || 'Premium Pass',
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.status,
      paymentMethod: booking.paymentMethod || 'PhonePe Verified Payment',
      transactionId: booking.transactionId || booking.phonePeMerchantTxnId,
      bookingDate: booking.bookingDate || booking.createdAt,
      verifiedAt: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

