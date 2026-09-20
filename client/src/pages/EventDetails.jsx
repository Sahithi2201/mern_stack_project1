import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Ticket,
  ShieldCheck,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import eventService from '../services/eventService.js';
import Loading from '../components/Loading.jsx';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/helpers.js';
import '../styles/eventDetails.css';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      setImgError(false);
      const data = await eventService.getEventById(id);
      setEvent(data);
      if (data?.name) {
        document.title = `Tixora — ${data.name}`;
      }
    } catch (err) {
      console.error('Failed to load event details:', err);
      if (err.response && (err.response.status === 404 || err.response.status === 400)) {
        setError('Event not found.');
      } else {
        setError(getErrorMessage(err) || 'Unable to load event details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleBookTickets = () => {
    if (!event || event.availableSeats <= 0) return;

    if (isAuthenticated) {
      navigate(`/booking/${id}`);
    } else {
      navigate('/login', {
        state: { from: { pathname: `/booking/${id}` } },
      });
    }
  };

  if (loading) {
    return <Loading message="Loading event details..." />;
  }

  if (error) {
    const isNotFound = error === 'Event not found.';

    return (
      <div className="event-details-page" id="event-details-error">
        <div className="details-error-card" role="alert">
          <AlertCircle size={40} className="details-error-icon" />
          <h2 className="details-error-title">
            {isNotFound ? 'Event Not Found' : 'Something went wrong'}
          </h2>
          <p className="details-error-desc">
            {isNotFound
              ? 'The event you are looking for does not exist or may have been removed.'
              : error}
          </p>
          <div className="details-error-actions">
            <Link to="/events" className="btn-primary" id="btn-back-events">
              <ArrowLeft size={16} />
              <span>Back to Events</span>
            </Link>
            {!isNotFound && (
              <button
                type="button"
                onClick={fetchEvent}
                className="btn-outline"
                id="btn-retry-details"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const {
    name,
    description,
    category,
    location,
    date,
    time,
    price,
    totalSeats,
    availableSeats,
    image,
  } = event;

  const isSoldOut = availableSeats === 0;

  return (
    <div className="event-details-page" id="event-details-page">
      {/* Navigation Breadcrumbs & Back button */}
      <div className="details-top-bar">
        <Link to="/events" className="btn-back-link">
          <ArrowLeft size={16} />
          <span>Back to all events</span>
        </Link>
        <div className="breadcrumb-pill">
          <span className="breadcrumb-parent">Events</span>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-active">{category}</span>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="details-layout-grid">
        {/* Left Column: Media Poster & Description */}
        <div className="details-main-col">
          <div className="details-image-card">
            {image && !imgError ? (
              <img
                src={image}
                alt={name}
                className="details-large-image"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="details-image-placeholder" aria-label="Event visual poster">
                <Ticket size={64} className="details-placeholder-icon" />
                <span className="details-placeholder-text">{category || 'Tixora Event'}</span>
              </div>
            )}
            <span className="details-badge-category">{category}</span>
          </div>

          <article className="details-description-box">
            <h1 className="details-event-name">{name}</h1>

            <div className="details-meta-bar">
              <div className="meta-badge-item">
                <Calendar size={16} className="meta-icon" />
                <span>{formatDate(date)}</span>
              </div>
              <div className="meta-badge-item">
                <Clock size={16} className="meta-icon" />
                <span>{time || 'Time TBA'}</span>
              </div>
              <div className="meta-badge-item">
                <MapPin size={16} className="meta-icon" />
                <span>{location}</span>
              </div>
            </div>

            <div className="description-section">
              <h2 className="section-subheading">About This Event</h2>
              <p className="details-description-text">{description}</p>
            </div>

            {/* Micro Guarantees */}
            <div className="details-guarantees-strip">
              <div className="guarantee-item">
                <ShieldCheck size={18} className="guarantee-icon" />
                <div>
                  <strong>Official Seat Reservation</strong>
                  <p>Guaranteed admission with live inventory hold</p>
                </div>
              </div>
              <div className="guarantee-item">
                <Sparkles size={18} className="guarantee-icon" />
                <div>
                  <strong>Instant Digital Confirmation</strong>
                  <p>Access your ticket code immediately after booking</p>
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* Right Column: Ticket Reservation Sticky Panel */}
        <aside className="details-sidebar-col" aria-label="Ticket reservation summary">
          <div className="ticket-action-card">
            <div className="ticket-card-header">
              <span className="ticket-card-label">Ticket Price</span>
              <div className="ticket-card-price">{formatCurrency(price)}</div>
              <span className="ticket-card-tax">per selected seat • all taxes included</span>
            </div>

            <div className="ticket-seat-status-box">
              <div className="status-row">
                <span className="status-label">Seat Availability</span>
                {isSoldOut ? (
                  <span className="badge-status-soldout" id="status-sold-out">
                    Sold Out
                  </span>
                ) : (
                  <span className="badge-status-available" id="status-seats-available">
                    <span className="pulse-dot" />
                    <span>{availableSeats} seats left</span>
                  </span>
                )}
              </div>

              <div
                className="capacity-bar-container"
                title={`${availableSeats} of ${totalSeats} seats remaining`}
              >
                <div
                  className={`capacity-bar-fill ${isSoldOut ? 'bar-empty' : ''}`}
                  style={{
                    width: `${totalSeats > 0 ? (availableSeats / totalSeats) * 100 : 0}%`,
                  }}
                />
              </div>

              <div className="capacity-text">
                <span>{availableSeats} free</span>
                <span>{totalSeats} venue total</span>
              </div>
            </div>

            {/* Venue & Time Summary */}
            <div className="sidebar-info-list">
              <div className="info-list-row">
                <MapPin size={18} className="info-row-icon" aria-hidden="true" />
                <div>
                  <strong>Venue Location</strong>
                  <p>{location}</p>
                </div>
              </div>

              <div className="info-list-row">
                <Calendar size={18} className="info-row-icon" aria-hidden="true" />
                <div>
                  <strong>Date & Time</strong>
                  <p>
                    {formatDate(date)} at {time}
                  </p>
                </div>
              </div>
            </div>

            {/* Call to action button */}
            <div className="sidebar-btn-wrapper">
              <button
                type="button"
                className={`btn-primary w-full btn-book-large ${isSoldOut ? 'btn-disabled' : ''}`}
                id="btn-book-tickets"
                disabled={isSoldOut}
                onClick={handleBookTickets}
                aria-label={isSoldOut ? 'Event is sold out' : `Book tickets for ${name}`}
              >
                {isSoldOut ? 'Sold Out' : 'Select Seats & Book'}
              </button>

              {!isAuthenticated && !isSoldOut && (
                <p className="auth-hint-text">
                  You will sign in or register to complete your reservation.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EventDetails;
