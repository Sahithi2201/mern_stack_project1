import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import generateSeats from '../utils/generateSeats.js';

/**
 * @desc    Get all events with search, filter, sort, and pagination
 * @route   GET /api/events
 * @access  Public
 */
export const getEvents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      location,
      date,
      sort = 'dateAsc'
    } = req.query;

    // Build MongoDB filter query
    const query = {};

    // 1. Search by event name (case-insensitive)
    if (search && search.trim() !== '') {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    // 2. Filter by category (case-insensitive exact match)
    if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
      query.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    // 3. Filter by location (case-insensitive substring match)
    if (location && location.trim() !== '') {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    // 4. Filter by specific date if provided
    if (date && date.trim() !== '') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(parsedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        query.date = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    // 5. Sorting validation
    let sortOption = { date: 1 }; // Default: date ascending
    if (sort === 'priceAsc') {
      sortOption = { price: 1 };
    } else if (sort === 'priceDesc') {
      sortOption = { price: -1 };
    } else if (sort === 'dateAsc') {
      sortOption = { date: 1 };
    } else if (sort === 'dateDesc') {
      sortOption = { date: -1 };
    }

    // 6. Pagination calculation
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with count for pagination metadata
    const totalEvents = await Event.countDocuments(query);
    const totalPages = Math.ceil(totalEvents / limitNum);

    const events = await Event.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      events,
      page: pageNum,
      limit: limitNum,
      totalEvents,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid Event ID format',
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    // Automatically release any expired seat holds
    const now = new Date();
    let seatExpired = false;
    if (event.seats) {
      event.seats.forEach((s) => {
        if (s.status === 'HELD' && s.holdExpiresAt && new Date(s.holdExpiresAt) <= now) {
          s.status = 'AVAILABLE';
          s.heldBy = null;
          s.holdExpiresAt = null;
          seatExpired = true;
        }
      });
    }
    if (event.shows) {
      event.shows.forEach((show) => {
        if (show.seats) {
          show.seats.forEach((s) => {
            if (s.status === 'HELD' && s.holdExpiresAt && new Date(s.holdExpiresAt) <= now) {
              s.status = 'AVAILABLE';
              s.heldBy = null;
              s.holdExpiresAt = null;
              seatExpired = true;
            }
          });
        }
      });
    }
    if (seatExpired) {
      await event.save();
    }

    return res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new event (Admin only)
 * @route   POST /api/events
 * @access  Private / Admin
 */
export const createEvent = async (req, res, next) => {
  try {
    const {
      name,
      title,
      description,
      category,
      location,
      date,
      time,
      price,
      totalSeats,
      image = '',
      backgroundImage = '',
      heroImage = '',
    } = req.body;

    const eventName = (name || title || '').trim();

    // 1. Validation for required fields
    if (
      !eventName ||
      !description ||
      !category ||
      !location ||
      !date ||
      !time ||
      price === undefined ||
      totalSeats === undefined
    ) {
      return res.status(400).json({
        message:
          'Please provide all required fields: name (or title), description, category, location, date, time, price, totalSeats',
      });
    }

    // 2. Validate price
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        message: 'Price must be a number greater than or equal to 0',
      });
    }

    // 3. Validate totalSeats
    const parsedTotalSeats = parseInt(totalSeats, 10);
    if (isNaN(parsedTotalSeats) || parsedTotalSeats <= 0) {
      return res.status(400).json({
        message: 'Total seats must be a positive integer greater than 0',
      });
    }

    // 4. Validate Date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: 'Please provide a valid date format',
      });
    }

    // 5. Generate seats automatically & set initial available seats
    const generatedSeats = generateSeats(parsedTotalSeats);
    const availableSeats = parsedTotalSeats; // Client cannot manipulate this

    // 6. Create event
    const event = await Event.create({
      name: eventName,
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      date: parsedDate,
      time: time.trim(),
      price: parsedPrice,
      totalSeats: parsedTotalSeats,
      availableSeats,
      image: image.trim(),
      backgroundImage: (backgroundImage || heroImage || image || '').trim(),
      heroImage: (heroImage || backgroundImage || image || '').trim(),
      seats: generatedSeats,
    });

    return res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing event (Admin only)
 * @route   PUT /api/events/:id
 * @access  Private / Admin
 */
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid Event ID format',
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    const {
      name,
      title,
      description,
      category,
      location,
      date,
      time,
      price,
      totalSeats,
      image,
      backgroundImage,
      heroImage,
    } = req.body;

    // Check if totalSeats is being modified
    if (totalSeats !== undefined && parseInt(totalSeats, 10) !== event.totalSeats) {
      const newTotal = parseInt(totalSeats, 10);
      if (isNaN(newTotal) || newTotal <= 0) {
        return res.status(400).json({
          message: 'Total seats must be an integer greater than 0',
        });
      }

      // Check whether bookings already exist for this event
      const bookingsCount = await Booking.countDocuments({ event: event._id });
      if (bookingsCount > 0) {
        return res.status(400).json({
          message: 'Cannot change total seats for an event with existing bookings',
        });
      }

      // If no bookings exist, safely regenerate seats
      event.totalSeats = newTotal;
      event.availableSeats = newTotal;
      event.seats = generateSeats(newTotal);
    }

    // Update standard fields if provided
    if (name !== undefined) event.name = name.trim();
    else if (title !== undefined) event.name = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (category !== undefined) event.category = category.trim();
    if (location !== undefined) event.location = location.trim();
    if (time !== undefined) event.time = time.trim();
    if (image !== undefined) event.image = image.trim();
    if (backgroundImage !== undefined) event.backgroundImage = backgroundImage.trim();
    if (heroImage !== undefined) event.heroImage = heroImage.trim();

    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          message: 'Price must be greater than or equal to 0',
        });
      }
      event.price = parsedPrice;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: 'Please provide a valid date',
        });
      }
      event.date = parsedDate;
    }

    const updatedEvent = await event.save();

    return res.status(200).json({
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an event (Admin only)
 * @route   DELETE /api/events/:id
 * @access  Private / Admin
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid Event ID format',
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    // Check if bookings exist for this event
    const bookingExists = await Booking.findOne({ event: event._id });
    if (bookingExists) {
      return res.status(400).json({
        message: 'Cannot delete an event with existing bookings.',
      });
    }

    await Event.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Event deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset all seats of an event to AVAILABLE (Admin only)
 * @route   POST /api/events/:id/reset-seats
 * @access  Private / Admin
 */
export const resetEventSeats = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid Event ID format',
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    // Check if active confirmed bookings exist
    const confirmedBooking = await Booking.findOne({
      event: event._id,
      status: 'CONFIRMED',
    });

    if (confirmedBooking) {
      return res.status(400).json({
        message: 'Cannot reset seats for an event with active confirmed bookings',
      });
    }

    // Reset all seats to AVAILABLE
    event.seats.forEach((seat) => {
      seat.status = 'AVAILABLE';
    });
    event.availableSeats = event.totalSeats;

    await event.save();

    return res.status(200).json({
      message: 'Event seats successfully reset to available',
      event,
    });
  } catch (error) {
    next(error);
  }
};
