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
import { getEventCinematicBackground } from '../utils/categoryBackgrounds.js';
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
      setError(getErrorMessage(err) || 'Unable to load event details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleBookTickets = () => {
    if (!event) return;
    navigate(`/booking/${event._id || id}`);
  };

  if (loading) {
    return <Loading fullScreen={false} message="Loading event details..." />;
  }

  if (error || !event) {
    return (
      <div className="event-error-container" id="event-error-state">
        <div className="event-error-card">
          <AlertCircle size={48} className="error-icon" />
          <h2 className="error-title">Event Not Found</h2>
          <p className="error-message">
            {error || 'The requested event is either unavailable, expired, or has been removed.'}
          </p>
          <div className="error-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={fetchEvent}
            >
              Try Again
            </button>
            <Link to="/events" className="btn-primary">
              Browse Other Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    name,
    category,
    description,
    date,
    time,
    location,
    price,
    availableSeats,
    totalSeats,
    image,
  } = event;

  const isSoldOut = availableSeats === 0;
  const heroBg = getEventCinematicBackground(event);

  return (
    <div className="event-details-page" id="event-details-page">
      {/* 1. Full-Width Premium Event Hero Section */}
      <section
        className="details-hero-section"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(17, 4, 14, 0.95) 0%, rgba(22, 5, 18, 0.82) 48%, rgba(13, 3, 11, 0.40) 100%), linear-gradient(180deg, rgba(13, 3, 11, 0.25) 0%, rgba(13, 3, 11, 0.95) 100%), url(${heroBg})`,
        }}
      >
        <div className="details-hero-container">
          {/* Top navigation: Sleek back button, strictly NO breadcrumbs */}
          <div className="hero-top-nav">
            <Link to="/events" className="hero-back-link">
              <ArrowLeft size={16} />
              <span>Back to all events</span>
            </Link>
          </div>

          <div className="hero-content-grid">
            <div className="hero-text-col">
              {/* Event Category Badges */}
              <div className="hero-badge-row">
                <span className="hero-category-badge">{category}</span>
                {event.genre && <span className="hero-tag-badge">{event.genre}</span>}
                {event.language && <span className="hero-tag-badge">{event.language}</span>}
                {event.certificate && <span className="hero-tag-badge">{event.certificate}</span>}
              </div>

              {/* Event Title */}
              <h1 className="hero-event-title">{name}</h1>

              {/* Date & Venue Bar */}
              <div className="hero-meta-strip">
                <div className="hero-meta-item">
                  <Calendar size={16} className="hero-meta-icon" />
                  <span>{formatDate(date)}</span>
                </div>
                <div className="hero-meta-item">
                  <Clock size={16} className="hero-meta-icon" />
                  <span>{time || 'Time TBA'}</span>
                </div>
                <div className="hero-meta-item">
                  <MapPin size={16} className="hero-meta-icon" />
                  <span>{location}</span>
                </div>
              </div>

              {/* Short event description summary */}
              <p className="hero-short-description">
                {description && description.length > 220
                  ? `${description.slice(0, 220)}...`
                  : description}
              </p>

              {/* Starting from price & Book CTA */}
              <div className="hero-action-row">
                <div className="hero-price-block">
                  <span className="hero-price-label">Starting from</span>
                  <span className="hero-price-value">{formatCurrency(price)}</span>
                </div>

                <button
                  type="button"
                  className={`btn-primary hero-btn-book ${isSoldOut ? 'btn-disabled' : ''}`}
                  id="btn-book-tickets-hero"
                  disabled={isSoldOut}
                  onClick={handleBookTickets}
                >
                  <Ticket size={18} />
                  <span>{isSoldOut ? 'Sold Out' : 'Select Seats & Book'}</span>
                </button>
              </div>
            </div>

            {/* Event Poster Card on Right */}
            <div className="hero-poster-col">
              <div className="hero-poster-frame">
                {image && !imgError ? (
                  <img
                    src={image}
                    alt={name}
                    className="hero-poster-img"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="hero-poster-placeholder">
                    <Ticket size={56} className="hero-placeholder-icon" />
                    <span>{category || 'Tixora'}</span>
                  </div>
                )}
                {isSoldOut && <span className="hero-soldout-ribbon">Sold Out</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Detailed Info & Reservation Strip below Hero */}
      <div className="details-body-container">
        <div className="details-layout-grid">
          {/* Left Column: Full Description & Guarantees */}
          <div className="details-main-col">
            <article className="details-card-cinematic">
              <h2 className="cinematic-section-title">About This Experience</h2>
              <p className="details-description-text">{description}</p>

              {/* Micro Guarantees Strip */}
              <div className="details-guarantees-strip">
                <div className="guarantee-item">
                  <ShieldCheck size={20} className="guarantee-icon" />
                  <div>
                    <strong>Official Seat Reservation</strong>
                    <p>Guaranteed admission with live inventory hold</p>
                  </div>
                </div>
                <div className="guarantee-item">
                  <Sparkles size={20} className="guarantee-icon" />
                  <div>
                    <strong>Instant Digital Pass</strong>
                    <p>Access your ticket code immediately after booking</p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Right Column: Sticky Availability & Reservation Card */}
          <aside className="details-sidebar-col" aria-label="Ticket reservation summary">
            <div className="ticket-action-card-cinematic">
              <div className="ticket-card-header">
                <span className="ticket-card-label">Admission Pass</span>
                <div className="ticket-card-price">{formatCurrency(price)}</div>
                <span className="ticket-card-tax">per selected seat • taxes included</span>
              </div>

              <div className="ticket-seat-status-box">
                <div className="status-row">
                  <span className="status-label">Live Availability</span>
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
                  <span>{availableSeats} available</span>
                  <span>{totalSeats} venue capacity</span>
                </div>
              </div>

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
                    <strong>Date & Showtime</strong>
                    <p>
                      {formatDate(date)} at {time}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sidebar-btn-wrapper">
                <button
                  type="button"
                  className={`btn-primary w-full btn-book-large ${isSoldOut ? 'btn-disabled' : ''}`}
                  id="btn-book-tickets-sidebar"
                  disabled={isSoldOut}
                  onClick={handleBookTickets}
                  aria-label={isSoldOut ? 'Event is sold out' : `Book tickets for ${name}`}
                >
                  {isSoldOut ? 'Sold Out' : 'Select Seats & Book'}
                </button>

                {!isAuthenticated && !isSoldOut && (
                  <p className="auth-hint-text">
                    Sign in or guest checkout is available on the next screen.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
