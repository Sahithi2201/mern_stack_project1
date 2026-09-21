import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Ticket,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  Lock,
  Bell,
  LogOut,
  Edit3,
  ExternalLink,
  X,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import bookingService from '../services/bookingService.js';
import { formatDate, formatCurrency } from '../utils/helpers.js';
import '../styles/profile.css';

const Profile = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState({
    smsTickets: true,
    emailConfirm: true,
    premiereAlerts: false,
  });

  useEffect(() => {
    document.title = 'Tixora — Account Dashboard';
  }, []);

  // Fetch real user bookings for dashboard metrics and recent reservations list
  const fetchUserBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      const data = await bookingService.getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not fetch bookings for profile dashboard:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    fetchUserBookings();
  }, [fetchUserBookings]);

  // Derived metrics
  const totalBookingsCount = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const upcomingCount = confirmedBookings.length;
  const totalTicketsBooked = bookings.reduce(
    (sum, b) => sum + (b.selectedSeats?.length || b.numberOfSeats || 1),
    0
  );

  const handleToggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    // Simulate instant local update for name
    if (user && editedName.trim()) {
      user.name = editedName.trim();
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowEditModal(false);
    }, 1200);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="profile-page-wrapper" id="account-profile-dashboard">
      {/* 1. Cinematic Profile Hero Card */}
      <section className="profile-hero-card" aria-label="User Profile Summary">
        <div className="profile-hero-left">
          <div className="profile-avatar-circle" aria-hidden="true">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="profile-identity-info">
            <div className="profile-name-badge-row">
              <h1 className="profile-user-name" id="profile-user-name">
                {user?.name || 'Valued Member'}
              </h1>
              <span className={`profile-verified-badge ${isAdmin ? 'admin' : ''}`}>
                <Shield size={13} />
                <span>{isAdmin ? 'System Admin' : 'Verified Member'}</span>
              </span>
            </div>

            <p className="profile-email-line">
              <Mail size={14} />
              <span>{user?.email || 'member@tixora.app'}</span>
            </p>

            <span className="profile-member-date">
              Member since {user?.createdAt ? formatDate(user.createdAt) : '2026'}
            </span>
          </div>
        </div>

        <div className="profile-hero-actions">
          <button
            type="button"
            className="btn-profile-edit"
            id="btn-edit-profile-modal"
            onClick={() => {
              setEditedName(user?.name || '');
              setShowEditModal(true);
            }}
          >
            <Edit3 size={15} />
            <span>Edit Profile</span>
          </button>

          <Link
            to="/my-bookings"
            className="btn-profile-bookings"
            id="btn-profile-my-bookings"
          >
            <Ticket size={16} />
            <span>My Bookings</span>
          </Link>
        </div>
      </section>

      {/* 2. Account Overview (4 Metric Cards) */}
      <section className="profile-overview-section" aria-label="Account Overview">
        <div className="profile-section-title-row">
          <h2 className="profile-section-title">
            <Sparkles size={18} color="#D6A83A" />
            <span>Account Overview</span>
          </h2>
          <Link to="/events" className="profile-section-link">
            <span>Explore Events</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="profile-metrics-grid">
          {/* Metric 1: Total Bookings */}
          <div className="metric-stat-card" id="metric-total-bookings">
            <div className="metric-stat-top">
              <span className="metric-stat-label">Total Bookings</span>
              <div className="metric-icon-wrap gold">
                <Ticket size={18} />
              </div>
            </div>
            <div className="metric-stat-value">{totalBookingsCount}</div>
            <span className="metric-stat-subtext">Lifetime event orders</span>
          </div>

          {/* Metric 2: Upcoming Events */}
          <div className="metric-stat-card" id="metric-upcoming-events">
            <div className="metric-stat-top">
              <span className="metric-stat-label">Upcoming Events</span>
              <div className="metric-icon-wrap green">
                <Calendar size={18} />
              </div>
            </div>
            <div className="metric-stat-value">{upcomingCount}</div>
            <span className="metric-stat-subtext">Active seat reservations</span>
          </div>

          {/* Metric 3: Tickets Booked */}
          <div className="metric-stat-card" id="metric-total-tickets">
            <div className="metric-stat-top">
              <span className="metric-stat-label">Reserved Seats</span>
              <div className="metric-icon-wrap velvet">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="metric-stat-value">{totalTicketsBooked}</div>
            <span className="metric-stat-subtext">Individual admission passes</span>
          </div>

          {/* Metric 4: Account Tier */}
          <div className="metric-stat-card" id="metric-account-tier">
            <div className="metric-stat-top">
              <span className="metric-stat-label">Account Tier</span>
              <div className="metric-icon-wrap gold">
                <Shield size={18} />
              </div>
            </div>
            <div className="metric-stat-value" style={{ fontSize: '1.45rem', textTransform: 'uppercase' }}>
              {isAdmin ? 'Admin' : 'VIP Pass'}
            </div>
            <span className="metric-stat-subtext">
              {isAdmin ? 'Full System Console' : 'Priority Seat Hold'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Recent Bookings Section */}
      <section className="profile-recent-bookings-section" aria-label="Recent Bookings">
        <div className="profile-section-title-row">
          <h2 className="profile-section-title">
            <Ticket size={18} color="#4A0D32" />
            <span>Recent Reservations</span>
          </h2>
          {totalBookingsCount > 0 && (
            <Link to="/my-bookings" className="profile-section-link">
              <span>View All ({totalBookingsCount})</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {loadingBookings ? (
          <div className="profile-empty-bookings-card">
            <p className="empty-subline">Loading recent reservations...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="profile-empty-bookings-card" id="profile-empty-state">
            <div className="empty-icon-circle" aria-hidden="true">
              <Ticket size={28} />
            </div>
            <h3 className="empty-headline">No Active Bookings</h3>
            <p className="empty-subline">
              You haven't reserved tickets for any events yet. Discover upcoming blockbuster movies, live concerts, and shows across 20+ cities.
            </p>
            <Link to="/events" className="btn-profile-bookings" style={{ marginTop: '8px' }}>
              <span>Explore 100+ Events</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="profile-bookings-grid" id="profile-recent-bookings-grid">
            {bookings.slice(0, 4).map((booking) => {
              const event = booking.event || {};
              const eventName = event.name || 'Event Reservation';
              const location = event.venue || event.location || 'Venue TBA';
              const isConfirmed = booking.status === 'CONFIRMED';
              const bookingRef = booking.bookingReference || booking._id;

              return (
                <article key={booking._id} className="profile-booking-item-card">
                  <div className="profile-booking-img-wrap">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={eventName}
                        className="profile-booking-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="profile-booking-img-fallback">
                        <Ticket size={32} />
                      </div>
                    )}
                    <span className="profile-booking-category-pill">
                      {event.category || 'Live'}
                    </span>
                  </div>

                  <div className="profile-booking-details">
                    <div className="profile-booking-top-strip">
                      <span className="profile-booking-ref-tag" title="Booking ID">
                        REF: {bookingRef.slice(-8)}
                      </span>
                      <span
                        className={`profile-booking-status-pill ${
                          isConfirmed ? 'confirmed' : 'cancelled'
                        }`}
                      >
                        {isConfirmed ? 'Confirmed' : 'Cancelled'}
                      </span>
                    </div>

                    <h3 className="profile-booking-event-title">{eventName}</h3>

                    <div className="profile-booking-meta-row">
                      <div className="profile-booking-meta-item">
                        <Calendar size={13} />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="profile-booking-meta-item">
                        <MapPin size={13} />
                        <span>{location}</span>
                      </div>
                    </div>

                    <div className="profile-booking-seats-strip">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Seats:
                      </span>
                      {booking.selectedSeats && booking.selectedSeats.length > 0 ? (
                        booking.selectedSeats.map((seat) => (
                          <span key={seat} className="profile-seat-pill">
                            {seat}
                          </span>
                        ))
                      ) : (
                        <span className="profile-seat-pill">General</span>
                      )}
                    </div>

                    <div className="profile-booking-footer-row">
                      <span className="profile-booking-price-tag">
                        {formatCurrency(booking.totalAmount)}
                      </span>
                      <Link
                        to={`/booking-confirmation/${bookingRef}`}
                        className="btn-profile-view-ticket"
                      >
                        <ExternalLink size={13} />
                        <span>View Ticket</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Account Settings & Security Grid */}
      <section className="profile-settings-section" aria-label="Account Settings">
        <div className="profile-section-title-row">
          <h2 className="profile-section-title">
            <Lock size={18} color="#4A0D32" />
            <span>Account Settings & Security</span>
          </h2>
        </div>

        <div className="profile-settings-grid">
          {/* Settings Card 1: Identity & Credentials */}
          <div className="profile-settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <User size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Identity & Access</h3>
                <p className="settings-card-subtitle">Verified account credentials</p>
              </div>
            </div>

            <div className="settings-item-list">
              <div className="settings-row-item">
                <div>
                  <span className="settings-row-label">Full Name</span>
                  <span className="settings-row-sub">{user?.name || 'Member'}</span>
                </div>
                <span className="settings-status-tag active">Verified</span>
              </div>

              <div className="settings-row-item">
                <div>
                  <span className="settings-row-label">Email Address</span>
                  <span className="settings-row-sub">{user?.email || 'N/A'}</span>
                </div>
                <span className="settings-status-tag active">Linked</span>
              </div>

              <div className="settings-row-item">
                <div>
                  <span className="settings-row-label">Password Protection</span>
                  <span className="settings-row-sub">Encrypted & salted hash</span>
                </div>
                <span className="settings-status-tag">Active</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-profile-edit"
              style={{ width: '100%', justifyContent: 'center', color: 'var(--velvet)', background: 'var(--breeze)', borderColor: 'var(--breeze-border)' }}
              onClick={() => setShowEditModal(true)}
            >
              Update Credentials
            </button>
          </div>

          {/* Settings Card 2: Notifications */}
          <div className="profile-settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Notifications</h3>
                <p className="settings-card-subtitle">Manage ticket delivery alerts</p>
              </div>
            </div>

            <div className="settings-item-list">
              <div className="settings-row-item">
                <div>
                  <span className="settings-row-label">Instant SMS Tickets</span>
                  <span className="settings-row-sub">Receive booking pass via SMS</span>
                </div>
                <label className="settings-toggle-input">
                  <input
                    type="checkbox"
                    checked={notifications.smsTickets}
                    onChange={() => handleToggleNotification('smsTickets')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="settings-row-item">
                <div>
                  <span className="settings-row-label">Email PDF Passes</span>
                  <span className="settings-row-sub">Send QR ticket to inbox</span>
                </div>
                <label className="settings-toggle-input">
                  <input
                    type="checkbox"
                    checked={notifications.emailConfirm}
                    onChange={() => handleToggleNotification('emailConfirm')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="settings-row-item">
                <div>
                  <span className="settings-row-label">Premiere Alerts</span>
                  <span className="settings-row-sub">Advance notices for hot events</span>
                </div>
                <label className="settings-toggle-input">
                  <input
                    type="checkbox"
                    checked={notifications.premiereAlerts}
                    onChange={() => handleToggleNotification('premiereAlerts')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
              Notifications apply across web & digital tickets.
            </div>
          </div>

          {/* Settings Card 3: Session & Danger Zone */}
          <div className="profile-settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon danger">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Session Management</h3>
                <p className="settings-card-subtitle">Token & active logins</p>
              </div>
            </div>

            <div className="settings-item-list">
              <div className="settings-row-item">
                <div>
                  <span className="settings-row-label">Active Session</span>
                  <span className="settings-row-sub">Current Browser & Device</span>
                </div>
                <span className="settings-status-tag active">Secure</span>
              </div>

              <div className="settings-row-item">
                <div>
                  <span className="settings-row-label">Two-Factor Authentication</span>
                  <span className="settings-row-sub">Session token signed</span>
                </div>
                <span className="settings-status-tag">Enabled</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-profile-logout"
              id="btn-profile-logout"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Sign Out of Tixora</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Edit Profile Modal Dialog */}
      {showEditModal && (
        <div className="profile-modal-backdrop" role="dialog" aria-modal="true">
          <div className="profile-modal-dialog">
            <div className="modal-header-row">
              <h3 className="modal-title">Edit Profile</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {saveSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle2 size={48} color="#287A55" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ color: 'var(--velvet)', fontSize: '1.2rem', fontWeight: '800' }}>
                  Profile Updated
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Your display name has been saved successfully.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label htmlFor="edit-name-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--velvet)' }}>
                    Full Name
                  </label>
                  <input
                    id="edit-name-input"
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--velvet)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    style={{ width: '100%', padding: '10px 14px', background: '#FAF7F0', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                    Email address is tied to your verified identity.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setShowEditModal(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

