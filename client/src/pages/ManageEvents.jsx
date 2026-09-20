import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  RotateCcw,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Ticket,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout.jsx';
import AdminTable from '../components/AdminTable.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EventFormModal from '../components/EventFormModal.jsx';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import eventService from '../services/eventService.js';
import { formatCurrency, formatDate } from '../utils/helpers.js';

const CATEGORIES = [
  'All',
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

const ManageEvents = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    confirmText: 'Confirm',
    action: null,
  });

  useEffect(() => {
    document.title = 'Tixora Admin — Manage Events';
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventService.getEvents({ limit: 100 });
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events for admin:', err);
      setError(err.response?.data?.message || 'Failed to retrieve events list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (searchParams.get('action') === 'new') {
      setIsFormModalOpen(true);
    }
  }, [searchParams]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (ev) => {
    setEditingEvent(ev);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      setActionLoading(true);
      if (editingEvent) {
        await eventService.updateEvent(editingEvent._id, formData);
        showFeedback('success', `Event "${formData.name}" updated successfully.`);
      } else {
        await eventService.createEvent(formData);
        showFeedback('success', `New event "${formData.name}" created successfully.`);
      }
      setIsFormModalOpen(false);
      setEditingEvent(null);
      await fetchEvents();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save event. Please check inputs.';
      showFeedback('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const promptDeleteEvent = (ev) => {
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Delete Event?',
      message: `Are you sure you want to permanently delete "${ev.name}"? This action cannot be undone.`,
      confirmText: 'Delete Event',
      action: async () => {
        try {
          setActionLoading(true);
          await eventService.deleteEvent(ev._id);
          showFeedback('success', `Event "${ev.name}" was permanently deleted.`);
          setConfirmDialog({ isOpen: false, action: null });
          await fetchEvents();
        } catch (err) {
          showFeedback('error', err.response?.data?.message || 'Failed to delete event.');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const promptResetSeats = (ev) => {
    setConfirmDialog({
      isOpen: true,
      type: 'warning',
      title: 'Reset All Seats to Available?',
      message: `Are you sure you want to reset all seats for "${ev.name}"? All currently booked seats will be marked AVAILABLE.`,
      confirmText: 'Reset Seats',
      action: async () => {
        try {
          setActionLoading(true);
          await eventService.resetSeats(ev._id);
          showFeedback('success', `All seats for "${ev.name}" have been reset to AVAILABLE.`);
          setConfirmDialog({ isOpen: false, action: null });
          await fetchEvents();
        } catch (err) {
          showFeedback('error', err.response?.data?.message || 'Failed to reset seats.');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'All' || ev.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const headers = [
    { label: 'Event Details' },
    { label: 'Category' },
    { label: 'Schedule' },
    { label: 'Ticket Price' },
    { label: 'Seat Inventory' },
    { label: 'Actions', align: 'right' },
  ];

  return (
    <AdminLayout
      title="Manage Events"
      subtitle="Create, update, monitor capacity, or reset seats for live experiences"
      actions={
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={handleOpenCreate}
        >
          <Plus size={14} />
          <span>Create Event</span>
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

      {error && <ErrorMessage message={error} onRetry={fetchEvents} />}

      {/* Filter and Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search events by title or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-filter-select-wrap">
          <select
            className="admin-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Data Table */}
      {loading ? (
        <Loading message="Fetching events directory..." />
      ) : (
        <div className="admin-panel-card">
          <AdminTable
            headers={headers}
            isEmpty={filteredEvents.length === 0}
            emptyTitle="No events found"
            emptyMessage={
              searchQuery || categoryFilter !== 'All'
                ? 'No events match your current search or category filter.'
                : 'No events have been created yet. Click "+ Create Event" to add one.'
            }
          >
            {filteredEvents.map((ev) => {
              const bookedCount = (ev.totalSeats || 0) - (ev.availableSeats || 0);
              const occupancyPct = ev.totalSeats
                ? Math.round((bookedCount / ev.totalSeats) * 100)
                : 0;

              return (
                <tr key={ev._id}>
                  <td>
                    <div className="table-event-cell">
                      <div className="table-event-avatar">
                        {ev.image ? (
                          <img src={ev.image} alt={ev.name} className="avatar-img" />
                        ) : (
                          <Ticket size={18} className="avatar-icon" />
                        )}
                      </div>
                      <div>
                        <Link to={`/events/${ev._id}`} className="table-primary-text hover-link">
                          {ev.name}
                        </Link>
                        <div className="table-sub-text">
                          <MapPin size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {ev.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="table-category-tag">{ev.category}</span>
                  </td>
                  <td>
                    <span className="table-primary-text">{formatDate(ev.date)}</span>
                    <span className="table-sub-text">{ev.time}</span>
                  </td>
                  <td>
                    <strong className="table-price-text">{formatCurrency(ev.price)}</strong>
                  </td>
                  <td>
                    <div className="table-capacity-wrap">
                      <div className="capacity-labels">
                        <span>{ev.availableSeats} / {ev.totalSeats} free</span>
                        <span>{occupancyPct}%</span>
                      </div>
                      <div className="capacity-bar-mini">
                        <div
                          className="capacity-fill-mini"
                          style={{
                            width: `${occupancyPct}%`,
                            backgroundColor: occupancyPct > 90 ? '#ef4444' : 'var(--primary)',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions-cell">
                      <Link
                        to={`/events/${ev._id}`}
                        className="table-action-icon-btn"
                        title="View Public Page"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <button
                        type="button"
                        className="table-action-icon-btn"
                        onClick={() => handleOpenEdit(ev)}
                        title="Edit Event"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        className="table-action-icon-btn warning"
                        onClick={() => promptResetSeats(ev)}
                        title="Reset Seats to Available"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        type="button"
                        className="table-action-icon-btn danger"
                        onClick={() => promptDeleteEvent(ev)}
                        title="Delete Event"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </AdminTable>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ isOpen: false, action: null })}
        type={confirmDialog.type}
        loading={actionLoading}
      />

      {/* Create / Edit Modal */}
      <EventFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        event={editingEvent}
        loading={actionLoading}
      />
    </AdminLayout>
  );
};

export default ManageEvents;
