import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import eventService from '../services/eventService.js';
import bookingService from '../services/bookingService.js';
import SeatGrid from '../components/SeatGrid.jsx';
import Loading from '../components/Loading.jsx';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/helpers.js';
import '../styles/booking.css';

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State management
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [limitMessage, setLimitMessage] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Fetch event details with seat layout
  const fetchEvent = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setPageError('');
      const data = await eventService.getEventById(id);
      setEvent(data);
    } catch (err) {
      console.error('Failed to load event for booking:', err);
      setPageError(getErrorMessage(err) || 'Unable to load event.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Handle seat click toggle
  const handleSeatToggle = (seatNumber) => {
    if (!event) return;

    // Check if the seat is already in selectedSeats
    if (selectedSeats.includes(seatNumber)) {
      // Deselect seat
      setSelectedSeats((prev) => prev.filter((s) => s !== seatNumber));
      setLimitMessage('');
      setBookingError('');
    } else {
      // Attempt to select seat: check against available seats limit
      const maxAvailable = event.availableSeats || 0;
      if (selectedSeats.length >= maxAvailable) {
        setLimitMessage('You cannot select more seats than are available.');
        return;
      }

      setLimitMessage('');
      setBookingError('');
      setSelectedSeats((prev) => [...prev, seatNumber]);
    }
  };

  // Confirm booking submission
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (selectedSeats.length === 0 || bookingSubmitting || !event) return;

    try {
      setBookingSubmitting(true);
      setBookingError('');
      setLimitMessage('');

      // Send strictly { eventId, selectedSeats } as requested by Phase 9 guidelines
      const payload = {
        eventId: id,
        selectedSeats,
      };

      const response = await bookingService.createBooking(payload);

      // Extract booking ID from response
      const bookingId = response?.booking?._id || response?._id;

      if (bookingId) {
        navigate(`/booking-confirmation/${bookingId}`);
      } else {
        throw new Error('Booking succeeded but no confirmation reference was returned.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      const serverMessage = getErrorMessage(err);
      setBookingError(
        serverMessage || 'Unable to complete booking. Please try again.'
      );

      // Stale Seat Handling: Always refresh event data to reflect latest seat statuses
      try {
        const freshEvent = await eventService.getEventById(id);
        setEvent(freshEvent);

        // Remove any now-BOOKED seats from current user selection
        const freshBookedSet = new Set(
          (freshEvent.seats || [])
            .filter((s) => s.status !== 'AVAILABLE')
            .map((s) => s.seatNumber)
        );

        setSelectedSeats((prev) =>
          prev.filter((seatNum) => !freshBookedSet.has(seatNum))
        );
      } catch (refreshErr) {
        console.warn('Could not refresh event after booking error:', refreshErr);
      }
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) {
    return <Loading message="Loading event and seating layout..." />;
  }

  if (pageError || !event) {
    return (
      <div className="page-container" id="booking-error-page">
        <div className="details-error-card" role="alert">
          <span className="details-error-icon">⚠️</span>
          <h2 className="details-error-title">Unable to load event</h2>
          <p className="details-error-desc">
            {pageError || 'We could not retrieve the event information.'}
          </p>
          <div className="details-error-actions">
            <button
              type="button"
              onClick={fetchEvent}
              className="btn-primary"
              id="btn-retry-booking-event"
            >
              Retry
            </button>
            <Link
              to="/events"
              className="btn-outline"
              style={{ color: '#4f46e5', borderColor: '#4f46e5' }}
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Frontend estimated total (for display only)
  const numberOfSeats = selectedSeats.length;
  const estimatedTotal = numberOfSeats * (event.price || 0);
  const isSoldOut = event.availableSeats === 0;

  return (
    <div className="booking-page-container" id="booking-page">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <Link to="/" className="breadcrumb-link">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/events" className="breadcrumb-link">Events</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to={`/events/${id}`} className="breadcrumb-link">{event.name}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current" aria-current="page">Select Seats</span>
      </nav>

      {/* 2. Event Summary Header */}
      <section className="booking-header-card" aria-label="Event Summary">
        <div className="booking-event-summary">
          <div className="booking-event-details">
            <span className="booking-event-badge">{event.category || 'Event'}</span>
            <h1 className="booking-event-title" id="booking-event-title">{event.name}</h1>
            <div className="booking-event-meta">
              <span className="booking-meta-item">
                <span aria-hidden="true">📍</span>
                <strong>{event.location}</strong>
              </span>
              <span className="booking-meta-item">
                <span aria-hidden="true">📅</span>
                <span>{formatDate(event.date)}</span>
              </span>
              <span className="booking-meta-item">
                <span aria-hidden="true">🕒</span>
                <span>{event.time || 'Time TBA'}</span>
              </span>
            </div>
          </div>

          <div className="booking-price-pill">
            <span className="booking-price-label">Price per seat</span>
            <span className="booking-price-value" id="booking-seat-price">
              {formatCurrency(event.price)} / seat
            </span>
            <span
              className={`booking-seats-left ${isSoldOut ? 'sold-out' : ''}`}
              id="booking-seats-available-count"
            >
              {isSoldOut ? 'Sold Out' : `${event.availableSeats} seats available`}
            </span>
          </div>
        </div>
      </section>

      {/* Alert Banner for Booking Errors */}
      {bookingError && (
        <div className="alert-error" role="alert" id="booking-error-banner">
          <strong>Booking Failed: </strong> {bookingError}
        </div>
      )}

      {/* Main Content Layout: Seat Grid + Booking Summary Panel */}
      <div className="booking-content-grid">
        {/* Left Column: Interactive Seat Grid */}
        <section aria-label="Seat Selection Grid">
          <SeatGrid
            seats={event.seats || []}
            selectedSeats={selectedSeats}
            onToggleSeat={handleSeatToggle}
            limitMessage={limitMessage}
            disabled={bookingSubmitting || isSoldOut}
          />
        </section>

        {/* Right Column: Booking Summary Panel */}
        <aside
          className="booking-summary-panel"
          aria-label="Booking Summary Panel"
          id="booking-summary-panel"
        >
          <h2 className="summary-panel-title">Booking Summary</h2>

          {/* Selected Seats Display */}
          <div className="summary-seats-section">
            <div className="summary-label">Selected Seats</div>
            <div className="summary-selected-seats-list" id="selected-seats-display">
              {numberOfSeats > 0 ? (
                selectedSeats.map((seatNum) => (
                  <span key={seatNum} className="seat-tag-pill">
                    {seatNum}
                  </span>
                ))
              ) : (
                <span className="no-seats-placeholder">
                  Please select at least one seat
                </span>
              )}
            </div>
          </div>

          {/* Price & Quantity Math Breakdown */}
          <div className="summary-math-list">
            <div className="summary-math-row">
              <span>Number of Seats:</span>
              <strong id="summary-seat-count">{numberOfSeats}</strong>
            </div>
            <div className="summary-math-row">
              <span>Price per Seat:</span>
              <strong>{formatCurrency(event.price)}</strong>
            </div>
          </div>

          {/* Total Amount Row */}
          <div className="summary-total-row">
            <span>Total Amount:</span>
            <span className="summary-total-amount" id="summary-total-amount">
              {formatCurrency(estimatedTotal)}
            </span>
          </div>

          {/* Confirm Booking Action Button */}
          <div className="summary-actions-wrapper">
            <button
              type="button"
              className="btn-primary btn-confirm-booking"
              id="btn-confirm-booking"
              disabled={numberOfSeats === 0 || bookingSubmitting || isSoldOut}
              onClick={handleConfirmBooking}
              aria-label={
                bookingSubmitting
                  ? 'Booking in progress'
                  : numberOfSeats === 0
                  ? 'Please select at least one seat'
                  : `Confirm booking for ${numberOfSeats} seats`
              }
            >
              {bookingSubmitting ? 'Booking...' : 'Confirm Booking'}
            </button>

            <p className="summary-security-note">
              Seats are reserved instantly upon confirmation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Booking;
