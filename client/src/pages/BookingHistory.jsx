import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import bookingService from '../services/bookingService.js';
import Loading from '../components/Loading.jsx';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/helpers.js';
import '../styles/booking.css';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cancellation Modal State
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    document.title = 'Tixora — My Bookings';
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load user bookings:', err);
      setError(getErrorMessage(err) || 'Unable to load your bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenCancelModal = (booking) => {
    setBookingToCancel(booking);
    setCancelError('');
    setSuccessMessage('');
  };

  const handleCloseCancelModal = () => {
    if (cancelling) return;
    setBookingToCancel(null);
    setCancelError('');
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    try {
      setCancelling(true);
      setCancelError('');

      await bookingService.cancelBooking(bookingToCancel._id);

      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingToCancel._id ? { ...b, status: 'CANCELLED' } : b
        )
      );

      setSuccessMessage('Booking cancelled successfully. Seats have been returned to available pool.');
      setBookingToCancel(null);

      const freshBookings = await bookingService.getMyBookings();
      setBookings(Array.isArray(freshBookings) ? freshBookings : []);
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setCancelError(
        getErrorMessage(err) || 'Unable to cancel booking. Please try again.'
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <Loading message="Loading your reservation history..." />;
  }

  return (
    <div className="history-page-wrapper" id="booking-history-page">
      {/* Page Header */}
      <div className="page-header-block">
        <div className="page-header-text">
          <h1 className="page-main-title">My Bookings</h1>
          <p className="page-main-subtitle">
            View your upcoming events, digital seat passes, or manage cancellations.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="alert-success-banner" role="status" id="cancellation-success-banner">
          <CheckCircle2 size={18} className="alert-banner-icon" />
          <span>{successMessage}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setSuccessMessage('')}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* General Error Banner */}
      {error && (
        <div className="alert-error-banner" role="alert" id="history-error-banner">
          <AlertTriangle size={18} className="alert-banner-icon" />
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchBookings}
            className="alert-retry-link"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!error && bookings.length === 0 && (
        <div className="empty-bookings-card" id="empty-bookings-box">
          <div className="empty-bookings-icon-wrap" aria-hidden="true">
            <Ticket size={40} />
          </div>
          <h2 className="empty-bookings-title">No bookings yet</h2>
          <p className="empty-bookings-desc">
            You haven't reserved tickets for any events yet. Explore upcoming concerts, sports, conferences, and shows!
          </p>
          <Link to="/events" className="btn-primary" id="btn-explore-events-empty">
            <span>Explore Events</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Bookings List */}
      {bookings.length > 0 && (
        <div className="bookings-cards-grid" id="bookings-list-container">
          {bookings.map((booking) => {
            const isConfirmed = booking.status === 'CONFIRMED';
            const event = booking.event || {};
            const eventName = event.name || 'Event Reservation';
            const location = event.location || 'Venue TBA';
            const date = event.date;
            const time = event.time || 'Time TBA';
            const selectedSeats = booking.selectedSeats || [];
            const numberOfSeats = booking.numberOfSeats || selectedSeats.length;

            return (
              <article
                key={booking._id}
                className={`booking-item-card ${!isConfirmed ? 'booking-item-cancelled' : ''}`}
                id={`booking-card-${booking._id}`}
              >
                {/* Main Booking Details */}
                <div className="booking-card-body">
                  <div className="booking-card-top-strip">
                    <span className="booking-ref-badge" title="Booking ID">
                      ID: {booking._id}
                    </span>
                    <span
                      className={`booking-status-badge ${
                        isConfirmed ? 'status-confirmed' : 'status-cancelled'
                      }`}
                    >
                      <span className="badge-dot" />
                      {isConfirmed ? 'Confirmed' : 'Cancelled'}
                    </span>
                  </div>

                  <h2 className="booking-card-title">{eventName}</h2>

                  <div className="booking-card-meta-list">
                    <div className="meta-list-item">
                      <MapPin size={14} className="meta-icon" />
                      <span>{location}</span>
                    </div>
                    <div className="meta-list-item">
                      <Calendar size={14} className="meta-icon" />
                      <span>{formatDate(date)}</span>
                    </div>
                    <div className="meta-list-item">
                      <Clock size={14} className="meta-icon" />
                      <span>{time}</span>
                    </div>
                  </div>

                  <div className="booking-card-seats-wrap">
                    <span className="seats-count-label">
                      Reserved Seats ({numberOfSeats}):
                    </span>
                    <div className="seats-pills-row">
                      {selectedSeats.map((seat) => (
                        <span key={seat} className="seat-badge-pill">
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Amount, Date & Actions Sidebar */}
                <div className="booking-card-actions-side">
                  <div className="booking-card-price-block">
                    <span className="price-sub-label">Total Paid</span>
                    <span className="price-main-val">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </div>

                  <div className="booking-card-date-stamp">
                    Booked {formatDate(booking.bookingDate || booking.createdAt)}
                  </div>

                  {/* Cancel Button only for CONFIRMED bookings */}
                  {isConfirmed ? (
                    <button
                      type="button"
                      className="btn-cancel-reservation"
                      id={`btn-cancel-${booking._id}`}
                      onClick={() => handleOpenCancelModal(booking)}
                    >
                      Cancel Booking
                    </button>
                  ) : (
                    <span className="booking-cancelled-label">Cancelled</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Cancel Booking Confirmation Dialog */}
      {bookingToCancel && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <div className="modal-box-card">
            <div className="modal-danger-icon-circle" aria-hidden="true">
              <AlertTriangle size={28} />
            </div>

            <h2 className="modal-title" id="cancel-dialog-title">
              Cancel Ticket Reservation?
            </h2>

            <p className="modal-description">
              Your reserved seat(s) (
              <strong>{bookingToCancel.selectedSeats?.join(', ')}</strong>) for{' '}
              <strong>{bookingToCancel.event?.name || 'this event'}</strong> will
              be immediately released back to the available pool.
            </p>

            {cancelError && (
              <div className="modal-error-banner" role="alert">
                {cancelError}
              </div>
            )}

            <div className="modal-actions-grid">
              <button
                type="button"
                className="btn-modal-cancel-action"
                id="btn-modal-confirm-cancel"
                disabled={cancelling}
                onClick={handleConfirmCancel}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Reservation'}
              </button>
              <button
                type="button"
                className="btn-modal-keep-action"
                id="btn-keep-booking"
                disabled={cancelling}
                onClick={handleCloseCancelModal}
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
