import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight, Ticket } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers.js';

/**
 * EventCard Component — Redesigned for TIXORA
 * Theme: Gold + Velvet + White + Breeze
 */
const EventCard = ({ event }) => {
  const [imgError, setImgError] = useState(false);

  if (!event) return null;

  const {
    _id,
    name,
    category,
    location,
    date,
    time,
    price,
    availableSeats,
    image,
  } = event;

  const isSoldOut = availableSeats === 0;

  return (
    <article className="event-card" id={`event-card-${_id}`}>
      {/* 1. Media Image Container (220px, object-fit cover, overlay on hover) */}
      <div className="event-card-media">
        {image && !imgError ? (
          <>
            <img
              src={image}
              alt={name || 'Event poster'}
              className="event-card-img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
            <div className="event-card-media-overlay" aria-hidden="true" />
          </>
        ) : (
          <div className="event-card-fallback-poster" aria-label="Tixora Event Poster">
            <Ticket size={44} className="fallback-ticket-icon" />
            <span className="fallback-category-label">{category || 'TIXORA EVENT'}</span>
          </div>
        )}

        {/* Velvet Category Badge with subtle Gold border */}
        <span className="event-category-badge">{category || 'General'}</span>
      </div>

      {/* 2. Card Content */}
      <div className="event-card-content">
        <h3 className="event-card-title" title={name}>
          <Link to={`/events/${_id}`}>
            {name}
          </Link>
        </h3>

        <div className="event-card-meta-list">
          <div className="event-card-meta-item" title="Event Location">
            <MapPin size={15} className="event-card-meta-icon" aria-hidden="true" />
            <span>{location || 'Venue TBA'}</span>
          </div>

          <div className="event-card-meta-item" title="Event Date and Time">
            <Calendar size={15} className="event-card-meta-icon" aria-hidden="true" />
            <span>
              {formatDate(date)} {time ? `· ${time}` : ''}
            </span>
          </div>
        </div>

        {/* 3. Price and Availability */}
        <div className="event-card-stats-row">
          <div className="event-card-price-block">
            <span className="price-currency">{formatCurrency(price)}</span>
          </div>

          <div
            className={`event-card-seats-indicator ${isSoldOut ? 'sold-out' : ''}`}
            title="Available Seats"
          >
            {isSoldOut ? (
              'Sold Out'
            ) : (
              `${availableSeats} ${availableSeats === 1 ? 'seat' : 'seats'} left`
            )}
          </div>
        </div>

        {/* 4. Full-width View Details CTA Button */}
        <Link
          to={`/events/${_id}`}
          className="btn-card-details"
          id={`btn-view-details-${_id}`}
          aria-label={`View details for ${name}`}
        >
          <span>View Details</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};

export default EventCard;
