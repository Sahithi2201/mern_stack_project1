import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  DollarSign,
  Users,
  Plus,
  ArrowRight,
  Eye,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  MapPin,
  X,
  Sparkles
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout.jsx';
import AdminStatCard from '../components/AdminStatCard.jsx';
import AdminTable from '../components/AdminTable.jsx';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EventFormModal from '../components/EventFormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import eventService from '../services/eventService.js';
import bookingService from '../services/bookingService.js';
import userService from '../services/userService.js';
import { formatCurrency, formatDate } from '../utils/helpers.js';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);

  // Quick Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Selected Booking for View Modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Cancellation state
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    booking: null,
    loading: false,
  });

  useEffect(() => {
    document.title = 'Tixora Admin — Dashboard';
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [eventsRes, bookingsRes, usersRes] = await Promise.allSettled([
        eventService.getEvents({ limit: 100 }),
        bookingService.getAllBookings(),
        userService.getUsers(),
      ]);

      let eventsList = [];
      if (eventsRes.status === 'fulfilled') {
        eventsList = eventsRes.value.events || [];
        setRecentEvents(eventsList.slice(0, 5));
      }

      let allBookingsList = [];
      let bookingStats = {
        totalBookings: 0,
        confirmedCount: 0,
        cancelledCount: 0,
        totalRevenue: 0,
      };

      if (bookingsRes.status === 'fulfilled') {
        const data = bookingsRes.value;
        allBookingsList = data.bookings || [];
        if (data.stats) {
          bookingStats = data.stats;
        } else {
          bookingStats = {
            totalBookings: allBookingsList.length,
            confirmedCount: allBookingsList.filter((b) => b.status === 'CONFIRMED').length,
            cancelledCount: allBookingsList.filter((b) => b.status === 'CANCELLED').length,
            totalRevenue: allBookingsList
              .filter((b) => b.status === 'CONFIRMED')
              .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
          };
        }
        setRecentBookings(allBookingsList.slice(0, 6));
      }

      let userCount = 0;
      if (usersRes.status === 'fulfilled') {
        const users = usersRes.value || [];
        userCount = users.length;
      }

      setStats({
        totalEvents: eventsRes.status === 'fulfilled' ? (eventsRes.value.totalEvents ?? eventsList.length) : 0,
        totalUsers: userCount,
        totalBookings: bookingStats.totalBookings,
        confirmedBookings: bookingStats.confirmedCount,
        cancelledBookings: bookingStats.cancelledCount,
        totalRevenue: bookingStats.totalRevenue,
      });
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.response?.data?.message || 'Failed to aggregate administrative metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateEvent = async (eventData) => {
    try {
      setCreateLoading(true);
      await eventService.createEvent(eventData);
      setIsCreateModalOpen(false);
      setFeedbackMsg('New event published successfully!');
      setTimeout(() => setFeedbackMsg(''), 4000);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create event. Please check inputs.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePromptCancel = (booking) => {
    setCancelModal({
      isOpen: true,
      booking,
      loading: false,
    });
  };

  const handleExecuteCancel = async () => {
    if (!cancelModal.booking) return;

    try {
      setCancelModal((prev) => ({ ...prev, loading: true }));
      await bookingService.cancelBooking(cancelModal.booking._id);
      setCancelModal({ isOpen: false, booking: null, loading: false });
      setFeedbackMsg('Booking cancelled and seats restored to event inventory.');
      setTimeout(() => setFeedbackMsg(''), 4000);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
      setCancelModal((prev) => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <Loading message="Compiling Tixora analytics & operations metrics..." />
      </AdminLayout>
    );
  }

  const bookingHeaders = [
    { label: 'Booking ID' },
    { label: 'Event Name' },
    { label: 'User Name' },
    { label: 'Seats' },
    { label: 'Amount' },
    { label: 'Status' },
    { label: 'Date' },
    { label: 'Actions', align: 'right' },
  ];

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Comprehensive overview of inventory, revenue, and guest reservations"
      actions={
        <div className="admin-actions-group">
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={fetchDashboardData}
            title="Refresh statistics"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={14} />
            <span>Create Event</span>
          </button>
        </div>
      }
    >
      {feedbackMsg && (
        <div className="alert-success-banner" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchDashboardData} />}

      {/* 15. Stat cards (4 metrics) with icons */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Events</span>
            <div className="stat-card-icon-circle color-indigo">
              <Calendar size={18} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalEvents}</div>
          <span className="stat-card-subtitle">Active & scheduled events</span>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Bookings</span>
            <div className="stat-card-icon-circle color-amber">
              <Ticket size={18} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalBookings}</div>
          <span className="stat-card-subtitle">
            {stats.confirmedBookings} confirmed • {stats.cancelledBookings} cancelled
          </span>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Revenue</span>
            <div className="stat-card-icon-circle color-emerald">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="stat-card-value">{formatCurrency(stats.totalRevenue)}</div>
          <span className="stat-card-subtitle">From confirmed reservations</span>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Users</span>
            <div className="stat-card-icon-circle color-blue">
              <Users size={18} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalUsers}</div>
          <span className="stat-card-subtitle">Registered account holders</span>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="admin-quick-actions-bar">
        <span className="quick-actions-title">Quick Actions:</span>
        <div className="quick-actions-pills">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="quick-action-pill highlight"
          >
            <Plus size={14} />
            <span>+ Create Event</span>
          </button>
          <Link to="/admin/bookings" className="quick-action-pill">
            <Ticket size={14} />
            <span>View Bookings</span>
          </Link>
          <Link to="/admin/users" className="quick-action-pill">
            <Users size={14} />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Recent Bookings Table Section */}
      <div className="admin-panel-card">
        <div className="admin-panel-header">
          <div>
            <h2 className="admin-panel-title">Recent Bookings</h2>
            <p className="admin-panel-subtitle">
              Real-time audit log of latest attendee ticket reservations
            </p>
          </div>
          <Link to="/admin/bookings" className="btn-link-action">
            <span>View all bookings</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <AdminTable
          headers={bookingHeaders}
          isEmpty={recentBookings.length === 0}
          emptyTitle="No bookings found"
          emptyMessage="No ticket reservations have been recorded yet."
        >
          {recentBookings.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED';
            const userDisplay = b.user?.name || 'Registered Guest';
            const eventDisplay = b.event?.name || 'Event Reservation';
            const seatList = b.selectedSeats?.join(', ') || `${b.numberOfSeats} seat(s)`;

            return (
              <tr key={b._id}>
                <td>
                  <span className="table-ref-code">#{b._id.slice(-6).toUpperCase()}</span>
                </td>
                <td>
                  <span className="table-primary-text">{eventDisplay}</span>
                  {b.event?.location && (
                    <span className="table-sub-text">{b.event.location}</span>
                  )}
                </td>
                <td>
                  <span className="table-primary-text">{userDisplay}</span>
                  {b.user?.email && (
                    <span className="table-sub-text">{b.user.email}</span>
                  )}
                </td>
                <td>
                  <span className="table-seats-pill">{seatList}</span>
                </td>
                <td>
                  <strong className="table-price-text">
                    {formatCurrency(b.totalAmount || 0)}
                  </strong>
                </td>
                <td>
                  <span
                    className={`badge-status-pill ${
                      isConfirmed ? 'status-confirmed' : 'status-cancelled'
                    }`}
                  >
                    <span className="badge-dot" />
                    {isConfirmed ? 'Confirmed' : 'Cancelled'}
                  </span>
                </td>
                <td>
                  <span className="table-date-text">
                    {formatDate(b.bookingDate || b.createdAt)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="table-actions-cell">
                    <button
                      type="button"
                      className="table-action-icon-btn"
                      onClick={() => setSelectedBooking(b)}
                      title="View Booking Details"
                    >
                      <Eye size={15} />
                    </button>
                    {isConfirmed && (
                      <button
                        type="button"
                        className="table-action-icon-btn danger"
                        onClick={() => handlePromptCancel(b)}
                        title="Cancel Booking"
                      >
                        <XCircle size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </div>

      {/* Recent Events Section */}
      <div className="admin-panel-card" style={{ marginTop: '2rem' }}>
        <div className="admin-panel-header">
          <div>
            <h2 className="admin-panel-title">Recent Events</h2>
            <p className="admin-panel-subtitle">
              Live capacity monitoring and inventory utilization
            </p>
          </div>
          <Link to="/admin/events" className="btn-link-action">
            <span>Manage all events</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="admin-events-summary-grid">
          {recentEvents.map((ev) => {
            const bookedCount = (ev.totalSeats || 0) - (ev.availableSeats || 0);
            const occupancyPct = ev.totalSeats
              ? Math.round((bookedCount / ev.totalSeats) * 100)
              : 0;

            return (
              <div key={ev._id} className="admin-event-snapshot-card">
                <div className="snapshot-header">
                  <span className="snapshot-category">{ev.category}</span>
                  <span
                    className={`snapshot-status ${
                      ev.availableSeats === 0 ? 'soldout' : 'active'
                    }`}
                  >
                    {ev.availableSeats === 0 ? 'Sold Out' : 'Active'}
                  </span>
                </div>

                <h3 className="snapshot-title">{ev.name}</h3>

                <div className="snapshot-meta">
                  <div className="snapshot-meta-item">
                    <MapPin size={13} />
                    <span>{ev.location}</span>
                  </div>
                  <div className="snapshot-meta-item">
                    <Calendar size={13} />
                    <span>
                      {formatDate(ev.date)} • {ev.time}
                    </span>
                  </div>
                </div>

                <div className="snapshot-capacity">
                  <div className="capacity-numbers">
                    <span>
                      {ev.availableSeats} of {ev.totalSeats} seats free
                    </span>
                    <strong>{occupancyPct}% booked</strong>
                  </div>
                  <div className="capacity-bar-track">
                    <div
                      className="capacity-bar-progress"
                      style={{
                        width: `${occupancyPct}%`,
                        backgroundColor:
                          occupancyPct > 90 ? '#ef4444' : 'var(--primary)',
                      }}
                    />
                  </div>
                </div>

                <div className="snapshot-footer">
                  <span className="snapshot-price">{formatCurrency(ev.price)}</span>
                  <Link to={`/events/${ev._id}`} className="snapshot-view-link">
                    View Page
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedBooking(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-box-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div className="modal-top-header">
              <div>
                <span className="modal-subtitle-badge">
                  <Ticket size={13} />
                  <span>Reservation Record</span>
                </span>
                <h3 className="modal-main-title">
                  #{selectedBooking._id.slice(-6).toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setSelectedBooking(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-details-list">
              <div className="modal-detail-row">
                <span className="detail-label">Event:</span>
                <strong className="detail-val">{selectedBooking.event?.name}</strong>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Attendee:</span>
                <span className="detail-val">
                  {selectedBooking.user?.name} ({selectedBooking.user?.email})
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Status:</span>
                <span
                  className={`badge-status-pill ${
                    selectedBooking.status === 'CONFIRMED'
                      ? 'status-confirmed'
                      : 'status-cancelled'
                  }`}
                >
                  {selectedBooking.status}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Seats:</span>
                <span className="detail-val">
                  {selectedBooking.selectedSeats?.join(', ') || 'N/A'}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Amount:</span>
                <strong className="detail-val">
                  {formatCurrency(selectedBooking.totalAmount)}
                </strong>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Booked On:</span>
                <span className="detail-val">
                  {formatDate(selectedBooking.bookingDate || selectedBooking.createdAt)}
                </span>
              </div>
            </div>

            <div className="modal-actions-grid" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
              {selectedBooking.status === 'CONFIRMED' && (
                <button
                  type="button"
                  className="btn-modal-cancel-action"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    handlePromptCancel(b);
                  }}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelModal.isOpen}
        title="Cancel Ticket Reservation?"
        message={`Are you sure you want to cancel booking #${cancelModal.booking?._id.slice(-6).toUpperCase()}? The seats (${cancelModal.booking?.selectedSeats?.join(', ')}) will be returned immediately to the event available pool.`}
        confirmText="Cancel Reservation"
        cancelText="Keep Booking"
        onConfirm={handleExecuteCancel}
        onCancel={() => setCancelModal({ isOpen: false, booking: null, loading: false })}
        loading={cancelModal.loading}
      />

      {/* Create Event Modal */}
      <EventFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEvent}
        loading={createLoading}
      />
    </AdminLayout>
  );
};

export default AdminDashboard;
