import React, { useState, useEffect } from 'react';
import {
  Search,
  Ticket,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  Filter
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout.jsx';
import AdminTable from '../components/AdminTable.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import bookingService from '../services/bookingService.js';
import { formatCurrency, formatDate } from '../utils/helpers.js';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedCount: 0,
    cancelledCount: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Cancel Booking Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    bookingId: null,
    bookingCode: '',
  });

  // Booking Details Modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    document.title = 'Tixora Admin — Manage Bookings';
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const data = await bookingService.getAllBookings(params);
      const list = data.bookings || [];
      setBookings(list);

      if (data.stats) {
        setStats(data.stats);
      } else {
        setStats({
          totalBookings: list.length,
          confirmedCount: list.filter((b) => b.status === 'CONFIRMED').length,
          cancelledCount: list.filter((b) => b.status === 'CANCELLED').length,
          totalRevenue: list
            .filter((b) => b.status === 'CONFIRMED')
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        });
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError(err.response?.data?.message || 'Failed to retrieve bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
  };

  const promptCancelBooking = (booking) => {
    setConfirmDialog({
      isOpen: true,
      bookingId: booking._id,
      bookingCode: booking._id.slice(-6).toUpperCase(),
    });
  };

  const handleExecuteCancel = async () => {
    if (!confirmDialog.bookingId) return;

    try {
      setActionLoading(true);
      await bookingService.cancelBooking(confirmDialog.bookingId);
      showFeedback('success', `Booking #${confirmDialog.bookingCode} cancelled and seats returned to pool.`);
      setConfirmDialog({ isOpen: false, bookingId: null, bookingCode: '' });
      await fetchBookings();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cancel booking.';
      showFeedback('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const matchId = b._id?.toLowerCase().includes(query);
    const matchEvent = b.event?.name?.toLowerCase().includes(query);
    const matchUser = b.user?.name?.toLowerCase().includes(query) || b.user?.email?.toLowerCase().includes(query);
    return matchId || matchEvent || matchUser;
  });

  const headers = [
    { label: 'Booking Ref' },
    { label: 'Event' },
    { label: 'Attendee' },
    { label: 'Seats' },
    { label: 'Total Paid' },
    { label: 'Status' },
    { label: 'Date' },
    { label: 'Actions', align: 'right' },
  ];

  return (
    <AdminLayout
      title="Manage Bookings"
      subtitle="Audit guest reservations, monitor revenue streams, and handle ticket cancellations"
      actions={
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={fetchBookings}
          disabled={loading}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      }
    >
      {feedback.message && (
        <div
          className={feedback.type === 'success' ? 'alert-success-banner' : 'alert-error-banner'}
          style={{ marginBottom: '1.25rem' }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchBookings} />}

      {/* Mini Stat Summary */}
      <div className="admin-stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Orders</span>
            <div className="stat-card-icon-circle color-indigo">
              <Ticket size={18} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalBookings}</div>
          <span className="stat-card-subtitle">All-time reservation records</span>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Confirmed Orders</span>
            <div className="stat-card-icon-circle color-emerald">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-card-value">{stats.confirmedCount}</div>
          <span className="stat-card-subtitle">Active and verified passes</span>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Cancelled Orders</span>
            <div className="stat-card-icon-circle color-amber">
              <XCircle size={18} />
            </div>
          </div>
          <div className="stat-card-value">{stats.cancelledCount}</div>
          <span className="stat-card-subtitle">Seats returned to available pool</span>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Platform Revenue</span>
            <div className="stat-card-icon-circle color-emerald">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="stat-card-value">{formatCurrency(stats.totalRevenue)}</div>
          <span className="stat-card-subtitle">From confirmed sales</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by order ID, event name, or attendee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-filter-select-wrap">
          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed Only</option>
            <option value="CANCELLED">Cancelled Only</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <Loading message="Fetching booking logs..." />
      ) : (
        <div className="admin-panel-card">
          <AdminTable
            headers={headers}
            isEmpty={filteredBookings.length === 0}
            emptyTitle="No bookings found"
            emptyMessage={
              searchQuery || statusFilter !== 'ALL'
                ? 'No reservations match your active filter criteria.'
                : 'No ticket reservations have been recorded on the system yet.'
            }
          >
            {filteredBookings.map((b) => {
              const isConfirmed = b.status === 'CONFIRMED';
              const seatList = b.selectedSeats?.join(', ') || `${b.numberOfSeats} seat(s)`;

              return (
                <tr key={b._id}>
                  <td>
                    <span className="table-ref-code">#{b._id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td>
                    <span className="table-primary-text">{b.event?.name || 'Event Removed'}</span>
                    <span className="table-sub-text">{b.event?.location}</span>
                  </td>
                  <td>
                    <span className="table-primary-text">{b.user?.name || 'Customer'}</span>
                    <span className="table-sub-text">{b.user?.email}</span>
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
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                      {isConfirmed && (
                        <button
                          type="button"
                          className="table-action-icon-btn danger"
                          onClick={() => promptCancelBooking(b)}
                          title="Cancel Reservation"
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
      )}

      {/* Booking View Detail Modal */}
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
                <span className="detail-label">Location:</span>
                <span className="detail-val">{selectedBooking.event?.location}</span>
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
                <span className="detail-label">Date:</span>
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
                    promptCancelBooking(b);
                  }}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancellation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Cancel Ticket Reservation?"
        message={`Are you sure you want to cancel order #${confirmDialog.bookingCode}? Seats will be returned to the event immediately.`}
        confirmText="Cancel Reservation"
        cancelText="Keep Booking"
        onConfirm={handleExecuteCancel}
        onCancel={() => setConfirmDialog({ isOpen: false, bookingId: null, bookingCode: '' })}
        loading={actionLoading}
      />
    </AdminLayout>
  );
};

export default ManageBookings;
