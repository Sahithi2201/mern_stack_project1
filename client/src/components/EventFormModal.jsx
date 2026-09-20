import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, DollarSign, Users, Image, Sparkles } from 'lucide-react';

const CATEGORIES = [
  'Movie',
  'Concert',
  'Sports',
  'Conference',
  'Comedy',
  'College Event',
  'Workshop',
  'Theatre',
  'Other',
];

/**
 * EventFormModal
 * Modal form for creating and updating event records with validation and responsive inputs.
 */
const EventFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  event = null,
  loading = false,
}) => {
  const isEdit = Boolean(event);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Concert',
    location: '',
    date: '',
    time: '',
    price: '',
    totalSeats: 50,
    image: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      const formattedDate = event.date ? new Date(event.date).toISOString().split('T')[0] : '';
      setFormData({
        name: event.name || '',
        description: event.description || '',
        category: event.category || 'Concert',
        location: event.location || '',
        date: formattedDate,
        time: event.time || '',
        price: event.price !== undefined ? event.price : '',
        totalSeats: event.totalSeats || 50,
        image: event.image || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'Concert',
        location: '',
        date: '',
        time: '19:00',
        price: 49.99,
        totalSeats: 60,
        image: '',
      });
    }
    setError('');
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.category.trim() ||
      !formData.location.trim() ||
      !formData.date ||
      !formData.time.trim() ||
      formData.price === '' ||
      formData.totalSeats === ''
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    const parsedPrice = Number(formData.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Price must be a valid number greater than or equal to 0.');
      return;
    }

    const parsedSeats = parseInt(formData.totalSeats, 10);
    if (isNaN(parsedSeats) || parsedSeats <= 0) {
      setError('Total seats must be a positive integer.');
      return;
    }

    onSubmit({
      ...formData,
      price: parsedPrice,
      totalSeats: parsedSeats,
    });
  };

  return (
    <div className="modal-backdrop" onClick={loading ? undefined : onClose}>
      <div
        className="modal-box-card event-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
      >
        <div className="modal-top-header">
          <div>
            <span className="modal-subtitle-badge">
              <Sparkles size={13} />
              <span>Event Management</span>
            </span>
            <h2 id="event-modal-title" className="modal-main-title">
              {isEdit ? 'Edit Event Details' : 'Create New Event'}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="modal-error-banner" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form-body">
          {/* Event Title */}
          <div className="form-input-group">
            <label className="form-input-label" htmlFor="ev-name">
              Event Title *
            </label>
            <input
              id="ev-name"
              name="name"
              type="text"
              className="form-text-input"
              placeholder="e.g. Skyline Symphony Tour"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="form-input-group">
            <label className="form-input-label" htmlFor="ev-description">
              Event Description *
            </label>
            <textarea
              id="ev-description"
              name="description"
              rows={3}
              className="form-text-input textarea-input"
              placeholder="Detailed description of the experience..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Row: Category & Location */}
          <div className="form-two-col-grid">
            <div className="form-input-group">
              <label className="form-input-label" htmlFor="ev-category">
                Category *
              </label>
              <select
                id="ev-category"
                name="category"
                className="form-text-input"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-input-group">
              <label className="form-input-label" htmlFor="ev-location">
                Venue / Location *
              </label>
              <input
                id="ev-location"
                name="location"
                type="text"
                className="form-text-input"
                placeholder="e.g. Grand Theatre, NY"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Row: Date & Time */}
          <div className="form-two-col-grid">
            <div className="form-input-group">
              <label className="form-input-label" htmlFor="ev-date">
                Date *
              </label>
              <input
                id="ev-date"
                name="date"
                type="date"
                className="form-text-input"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-input-group">
              <label className="form-input-label" htmlFor="ev-time">
                Time *
              </label>
              <input
                id="ev-time"
                name="time"
                type="text"
                className="form-text-input"
                placeholder="e.g. 7:30 PM"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Row: Price & Total Seats */}
          <div className="form-two-col-grid">
            <div className="form-input-group">
              <label className="form-input-label" htmlFor="ev-price">
                Price per Seat ($) *
              </label>
              <input
                id="ev-price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                className="form-text-input"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-input-group">
              <label className="form-input-label" htmlFor="ev-totalSeats">
                Total Seating Capacity *
              </label>
              <input
                id="ev-totalSeats"
                name="totalSeats"
                type="number"
                min="1"
                max="500"
                className="form-text-input"
                placeholder="50"
                value={formData.totalSeats}
                onChange={handleChange}
                disabled={isEdit}
                required
              />
              {isEdit && (
                <span className="form-hint-note">
                  Capacity is fixed once created to preserve seating maps.
                </span>
              )}
            </div>
          </div>

          {/* Image URL */}
          <div className="form-input-group">
            <label className="form-input-label" htmlFor="ev-image">
              Cover Image URL (optional)
            </label>
            <input
              id="ev-image"
              name="image"
              type="url"
              className="form-text-input"
              placeholder="https://images.unsplash.com/..."
              value={formData.image}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions-grid" style={{ marginTop: '1.25rem' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
            <button
              type="button"
              className="btn-modal-keep-action"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFormModal;
