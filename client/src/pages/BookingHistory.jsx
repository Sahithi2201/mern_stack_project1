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
  ExternalLink,
  Copy,
  Check,
  Sparkles
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
  const [activeTab, setActiveTab] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

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

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

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

      setSuccessMessage('Booking cancelled successfully. Seats have been returned to the available inventory.');
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

  // Filter calculations
  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' && (!b.event?.date || new Date(b.event.date) >= now)
  );
  const completedBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' && b.event?.date && new Date(b.event.date) < now
  );
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'UPCOMING') return upcomingBookings.includes(b);
    if (activeTab === 'COMPLETED') return completedBookings.includes(b);
    if (activeTab === 'CANCELLED') return cancelledBookings.includes(b);
    return true; // 'ALL'
  });

  if (loading) {
    return <Loading message="Loading your reservation history..." />;
  }

  return (
    <div className="history-page-wrapper" id="booking-history-page">
      {/* 1. Cinematic Hero Header */}
      <section className="history-hero-card" aria-label="My Bookings Header">
        <div className="history-hero-text">
          <h1 id="my-bookings-title">My Event Reservations</h1>
          <p>
            Access your official digital boarding passes, manage seat allocations, or view verified attendance history.
          </p>
        </div>
        <Link to="/events" className="btn-history-explore" id="btn-explore-more-events">
          <Sparkles size={16} />
          <span>Explore 100+ Events</span>
        </Link>
      </section>

      {/* 2. Success / Error Banners */}
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

      {/* 3. Filter Tabs Bar */}
      <div className="history-tabs-bar" role="tablist" aria-label="Booking Filters">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ALL'}
          className={`history-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          <span>All Bookings</span>
          <span className="history-tab-count">{bookings.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'UPCOMING'}
          className={`history-tab-btn ${activeTab === 'UPCOMING' ? 'active' : ''}`}
          onClick={() => setActiveTab('UPCOMING')}
        >
          <span>Upcoming</span>
          <span className="history-tab-count">{upcomingBookings.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'COMPLETED'}
          className={`history-tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setActiveTab('COMPLETED')}
        >
          <span>Completed</span>
          <span className="history-tab-count">{completedBookings.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'CANCELLED'}
          className={`history-tab-btn ${activeTab === 'CANCELLED' ? 'active' : ''}`}
          onClick={() => setActiveTab('CANCELLED')}
        >
          <span>Cancelled</span>
          <span className="history-tab-count">{cancelledBookings.length}</span>
        </button>
      </div>

      {/* 4. Empty State */}
      {!error && filteredBookings.length === 0 && (
        <div className="history-empty-card" id="empty-bookings-box">
          <div className="history-empty-icon" aria-hidden="true">
            <Ticket size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--velvet)' }}>
            {activeTab === 'ALL'
              ? 'No bookings yet'
              : `No ${activeTab.toLowerCase()} bookings found`}
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '440px', fontSize: '0.92rem' }}>
            {activeTab === 'ALL'
              ? "You haven't reserved tickets for any events yet. Discover concerts, blockbusters, and live stadium events today."
              : `You have no bookings matching the ${activeTab.toLowerCase()} filter.`}
          </p>
          <Link to="/events" className="btn-history-explore" style={{ marginTop: '8px' }}>
            <span>Explore Events</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* 5. Bookings List */}
      {filteredBookings.length > 0 && (
        <div className="history-cards-list" id="bookings-list-container">
          {filteredBookings.map((booking) => {
            const isConfirmed = booking.status === 'CONFIRMED';
            const event = booking.event || {};
            const eventName = event.name || 'Event Reservation';
            const location = event.venue || event.location || 'Venue TBA';
            const date = event.date;
            const time = event.time || 'Time TBA';
            const selectedSeats = booking.selectedSeats || [];
            const numberOfSeats = booking.numberOfSeats || selectedSeats.length;
            const bookingRef = booking.bookingReference || booking._id;

            return (
              <article
                key={booking._id}
                className={`history-booking-card ${!isConfirmed ? 'is-cancelled' : ''}`}
                id={`booking-card-${booking._id}`}
              >
                {/* Event Poster Thumbnail */}
                <div className="history-card-poster">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={eventName}
                      className="history-poster-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="history-poster-fallback">
                      <Ticket size={40} />
                    </div>
                  )}
                  <span className="history-card-cat-pill">
                    {event.category || 'Live'}
                  </span>
                </div>

                {/* Card Body */}
                <div className="history-card-body">
                  <div className="history-card-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="history-ref-pill" title="Click to copy booking reference">
                        REF: {bookingRef.slice(-8)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(bookingRef)}
                        title="Copy Reference Code"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '2px',
                        }}
                      >
                        {copiedId === bookingRef ? (
                          <Check size={14} color="#287A55" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>

                    <span
                      className={`history-status-badge ${
                        isConfirmed ? 'confirmed' : 'cancelled'
                      }`}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isConfirmed ? '#287A55' : '#B33A3A',
                        }}
                      />
                      <span>{isConfirmed ? 'Confirmed' : 'Cancelled'}</span>
                    </span>
                  </div>

                  {event._id ? (
                    <Link
                      to={`/events/${event._id}`}
                      className="history-event-title-link"
                    >
                      {eventName}
                    </Link>
                  ) : (
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--velvet)', margin: 0 }}>
                      {eventName}
                    </h2>
                  )}

                  <div className="history-event-meta-grid">
                    <div className="history-meta-chip">
                      <Calendar size={14} color="#C9A227" />
                      <span>{formatDate(date)}</span>
                    </div>
                    <div className="history-meta-chip">
                      <Clock size={14} color="#C9A227" />
                      <span>{time}</span>
                    </div>
                    <div className="history-meta-chip">
                      <MapPin size={14} color="#C9A227" />
                      <span>{location}</span>
                    </div>
                  </div>

                  {/* Reserved Seats Chips */}
                  <div className="history-seats-container">
                    <span className="history-seats-label">
                      Reserved Seats ({numberOfSeats}):
                    </span>
                    {selectedSeats.length > 0 ? (
                      selectedSeats.map((seat) => (
                        <span key={seat} className="history-seat-tag">
                          {seat}
                        </span>
                      ))
                    ) : (
                      <span className="history-seat-tag">General Admission</span>
                    )}
                  </div>

                  {/* Footer Strip */}
                  <div className="history-card-footer">
                    <div className="history-price-col">
                      <span className="history-price-sub">Total Paid</span>
                      <span className="history-price-main">
                        {formatCurrency(booking.totalAmount)}
                      </span>
                    </div>

                    <div className="history-actions-col">
                      {event._id && (
                        <Link
                          to={`/events/${event._id}`}
                          className="btn-outline"
                          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                        >
                          Event Info
                        </Link>
                      )}

                      <Link
                        to={`/booking-confirmation/${bookingRef}`}
                        className="btn-history-ticket"
                        id={`btn-view-ticket-${booking._id}`}
                      >
                        <ExternalLink size={14} />
                        <span>View Pass</span>
                      </Link>

                      {isConfirmed && (
                        <button
                          type="button"
                          className="btn-history-cancel"
                          id={`btn-cancel-${booking._id}`}
                          onClick={() => handleOpenCancelModal(booking)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 6. Cancel Booking Confirmation Dialog */}
      {bookingToCancel && (
        <div
          className="cancel-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <div className="cancel-modal-box">
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
              aria-hidden="true"
            >
              <AlertTriangle size={28} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <h2
                id="cancel-dialog-title"
                style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--velvet)', marginBottom: '8px' }}
              >
                Cancel Ticket Reservation?
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.5' }}>
                Your reserved seats (
                <strong style={{ color: 'var(--velvet)' }}>
                  {bookingToCancel.selectedSeats?.join(', ')}
                </strong>
                ) for{' '}
                <strong style={{ color: 'var(--velvet)' }}>
                  {bookingToCancel.event?.name || 'this event'}
                </strong>{' '}
                will be released back to the event seating pool.
              </p>
            </div>

            {cancelError && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  border: '1px solid rgba(179, 58, 58, 0.3)',
                  color: 'var(--danger)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                }}
                role="alert"
              >
                {cancelError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn-outline"
                id="btn-keep-booking"
                disabled={cancelling}
                onClick={handleCloseCancelModal}
                style={{ flex: 1 }}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="btn-danger"
                id="btn-modal-confirm-cancel"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                style={{
                  flex: 1,
                  background: 'var(--danger)',
                  color: '#FFFFFF',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;

