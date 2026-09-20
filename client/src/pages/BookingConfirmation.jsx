import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Ticket, Calendar, MapPin, ArrowRight, AlertCircle, Copy, Check } from 'lucide-react';
import bookingService from '../services/bookingService.js';
import Loading from '../components/Loading.jsx';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/helpers.js';
import '../styles/booking.css';

const BookingConfirmation = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = 'Tixora — Booking Confirmed';
  }, []);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getBookingById(id);
      setBooking(data);
    } catch (err) {
      console.error('Failed to load booking details:', err);
      setError(getErrorMessage(err) || 'Unable to load booking details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCopyId = () => {
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (loading) {
    return <Loading message="Finalizing and verifying your digital ticket..." />;
  }

  if (error || !booking) {
    return (
      <div className="confirmation-page-wrapper" id="confirmation-error-page">
        <div className="details-error-card" role="alert">
          <AlertCircle size={40} className="details-error-icon" />
          <h2 className="details-error-title">Unable to load booking details</h2>
          <p className="details-error-desc">
            {error || 'We could not retrieve your booking receipt.'}
          </p>
          <div className="details-error-actions">
            <button
              type="button"
              onClick={fetchBooking}
              className="btn-primary"
              id="btn-retry-confirmation"
            >
              Retry
            </button>
            <Link to="/my-bookings" className="btn-outline">
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    _id,
    event,
    selectedSeats = [],
    numberOfSeats,
    totalAmount,
    status,
    bookingDate,
    createdAt,
  } = booking;

  const eventName = event?.name || 'Event Reservation';
  const location = event?.location || 'Venue TBA';
  const eventDate = event?.date;
  const eventTime = event?.time || 'TBA';
  const pricePerSeat = event?.price || (numberOfSeats ? totalAmount / numberOfSeats : 0);

  return (
    <div className="confirmation-page-wrapper" id="booking-confirmation-page">
      <div className="confirmation-container">
        {/* Success Header */}
        <div className="confirmation-hero-header">
          <div className="confirmation-check-circle" aria-hidden="true">
            <CheckCircle2 size={42} className="check-icon" />
          </div>
          <h1 className="confirmation-title" id="confirmation-header">
            Booking Confirmed!
          </h1>
          <p className="confirmation-subtitle">
            Your seats have been securely reserved. Here is your digital confirmation ticket.
          </p>
        </div>

        {/* Ticket-Style Confirmation Card */}
        <div className="boarding-ticket-card">
          {/* Top Ticket Header */}
          <div className="ticket-card-top">
            <div className="ticket-brand-badge">
              <Ticket size={16} />
              <span>TIXORA PASS</span>
            </div>
            <div className="ticket-status-pill">
              <span className="status-dot-green" />
              <span className="status-text">{status === 'CONFIRMED' ? 'CONFIRMED' : status}</span>
            </div>
          </div>

          {/* Event Title Banner */}
          <div className="ticket-event-banner">
            <h2 className="ticket-event-name" id="confirmed-event-name">
              {eventName}
            </h2>
            <div className="ticket-event-meta-row">
              <div className="ticket-meta-badge">
                <Calendar size={14} />
                <span>{formatDate(eventDate)} at {eventTime}</span>
              </div>
              <div className="ticket-meta-badge">
                <MapPin size={14} />
                <span>{location}</span>
              </div>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="ticket-divider">
            <div className="notch notch-left" />
            <div className="divider-dashes" />
            <div className="notch notch-right" />
          </div>

          {/* Ticket Body Details */}
          <div className="ticket-body-grid">
            {/* Booking ID with Copy */}
            <div className="ticket-field-block">
              <span className="ticket-field-label">Booking Reference</span>
              <div className="ticket-code-row">
                <span className="ticket-code-text" id="confirmed-booking-id">
                  {_id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="btn-copy-id"
                  title="Copy Booking ID"
                >
                  {copied ? <Check size={14} className="copied-icon" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Reserved Seats List */}
            <div className="ticket-field-block">
              <span className="ticket-field-label">Reserved Seats ({selectedSeats.length})</span>
              <div className="ticket-seat-pill-group" id="confirmed-seats-list">
                {selectedSeats.map((seat) => (
                  <span key={seat} className="ticket-seat-pill">
                    {seat}
                  </span>
                ))}
              </div>
            </div>

            {/* Total Paid */}
            <div className="ticket-field-block">
              <span className="ticket-field-label">Total Amount Paid</span>
              <span className="ticket-price-total" id="confirmed-total-amount">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* Date of Booking */}
            <div className="ticket-field-block">
              <span className="ticket-field-label">Transaction Date</span>
              <span className="ticket-field-val">
                {formatDate(bookingDate || createdAt)}
              </span>
            </div>
          </div>

          {/* Bottom Barcode Strip */}
          <div className="ticket-barcode-footer">
            <div className="barcode-visual" aria-hidden="true">
              ||| | |||| | || ||||| || | ||| |||| |||| | ||| | ||
            </div>
            <span className="barcode-caption">TIXORA VERIFIED DIGITAL TICKET</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="confirmation-actions-bar">
          <Link
            to="/my-bookings"
            className="btn-primary btn-lg"
            id="btn-view-my-bookings"
          >
            <span>View My Bookings</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/events"
            className="btn-outline btn-lg"
            id="btn-browse-more-events"
          >
            Explore More Events
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
