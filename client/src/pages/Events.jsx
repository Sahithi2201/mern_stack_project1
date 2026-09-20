import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, ArrowUpDown, RotateCcw, X, AlertCircle, Building2, Filter } from 'lucide-react';
import eventService from '../services/eventService.js';
import EventCard from '../components/EventCard.jsx';
import Loading from '../components/Loading.jsx';
import { getErrorMessage } from '../utils/helpers.js';
import '../styles/events.css';

const CATEGORIES = [
  'All Categories',
  'Movie',
  'Concert',
  'Sports',
  'Comedy',
  'Theatre',
  'Cultural',
  'Conference',
  'College Event',
  'Family',
];

const CITIES = [
  'All Cities',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Kochi',
  'Lucknow',
  'Indore',
  'Bhopal',
  'Bhubaneswar',
  'Visakhapatnam',
  'Vijayawada',
  'Goa',
  'Patna',
  'Guwahati',
];

const SORT_OPTIONS = [
  { label: 'Date — Earliest', value: 'dateAsc' },
  { label: 'Date — Latest', value: 'dateDesc' },
  { label: 'Price — Low to High', value: 'priceAsc' },
  { label: 'Price — High to Low', value: 'priceDesc' },
];

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query parameters
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'All Categories';
  const urlLocation = searchParams.get('location') || '';
  const urlDate = searchParams.get('date') || '';
  const urlSort = searchParams.get('sort') || 'dateAsc';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  // Local state for debounced search and location inputs
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [locationInput, setLocationInput] = useState(urlLocation);

  useEffect(() => {
    document.title = 'Tixora — Discover Events';
  }, []);

  useEffect(() => {
    setSearchTerm(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setLocationInput(urlLocation);
  }, [urlLocation]);

  // Data states
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalEvents: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const searchDebounceRef = useRef(null);
  const locationDebounceRef = useRef(null);

  const updateParams = useCallback(
    (newParams, resetPage = true) => {
      const current = Object.fromEntries(searchParams.entries());
      const updated = { ...current, ...newParams };

      if (resetPage) {
        updated.page = '1';
      }

      Object.keys(updated).forEach((key) => {
        if (
          !updated[key] ||
          (key === 'category' && updated[key] === 'All Categories') ||
          (key === 'location' && updated[key] === 'All Cities') ||
          (key === 'sort' && updated[key] === 'dateAsc') ||
          (key === 'page' && updated[key] === '1')
        ) {
          delete updated[key];
        }
      });

      setSearchParams(updated);
    },
    [searchParams, setSearchParams]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      updateParams({ search: value.trim() }, true);
    }, 300);
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);

    if (locationDebounceRef.current) {
      clearTimeout(locationDebounceRef.current);
    }

    locationDebounceRef.current = setTimeout(() => {
      updateParams({ location: value.trim() }, true);
    }, 300);
  };

  const handleCitySelect = (cityName) => {
    const locValue = cityName === 'All Cities' ? '' : cityName;
    setLocationInput(locValue);
    updateParams({ location: locValue }, true);
  };

  const handleCategoryChange = (e) => {
    updateParams({ category: e.target.value }, true);
  };

  const handleDateChange = (e) => {
    updateParams({ date: e.target.value }, true);
  };

  const handleSortChange = (e) => {
    updateParams({ sort: e.target.value }, false);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === urlPage) {
      return;
    }
    updateParams({ page: newPage.toString() }, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setLocationInput('');
    setSearchParams({});
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = {
        page: urlPage,
        limit: 12,
        sort: urlSort,
      };

      if (urlSearch.trim()) {
        queryParams.search = urlSearch.trim();
      }

      if (urlCategory && urlCategory !== 'All Categories') {
        queryParams.category = urlCategory.trim();
      }

      if (urlLocation.trim()) {
        queryParams.location = urlLocation.trim();
      }

      if (urlDate.trim()) {
        queryParams.date = urlDate.trim();
      }

      const data = await eventService.getEvents(queryParams);

      setEvents(data.events || []);
      setPagination({
        page: data.page || 1,
        limit: data.limit || 12,
        totalEvents: data.totalEvents || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError(getErrorMessage(err) || 'Unable to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [urlSearch, urlCategory, urlLocation, urlDate, urlSort, urlPage]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    };
  }, []);

  const hasActiveFilters =
    Boolean(urlSearch) ||
    (Boolean(urlCategory) && urlCategory !== 'All Categories') ||
    Boolean(urlLocation) ||
    Boolean(urlDate) ||
    urlSort !== 'dateAsc';

  return (
    <div className="events-page-container" id="events-page">
      {/* 1. Page Header */}
      <header className="events-header-section">
        <h1 className="events-headline">Discover Events</h1>
        <p className="events-tagline">
          Over 100 premium experiences across 20 major Indian cities.
        </p>

        {/* Quick City Pills Horizontal Scroller */}
        <div className="city-pills-bar" aria-label="City Filter Pills">
          {CITIES.slice(0, 10).map((city) => {
            const isSelected =
              (city === 'All Cities' && !urlLocation) ||
              urlLocation.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                type="button"
                className={`city-pill-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleCitySelect(city)}
              >
                {city}
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. Search Bar */}
      <div className="events-search-bar-wrap">
        <div className="events-search-bar" role="search">
          <Search size={20} className="search-bar-icon" aria-hidden="true" />
          <input
            id="events-search-input"
            type="text"
            className="search-bar-input"
            placeholder="Search events by title, genre, artist, language or venue..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Search events"
          />
          {searchTerm && (
            <button
              type="button"
              className="search-bar-clear-btn"
              onClick={() => {
                setSearchTerm('');
                updateParams({ search: '' }, true);
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Filter Panel (Breeze Container) */}
      <section className="events-filter-panel" aria-label="Event Filter Controls">
        <div className="filter-controls-row">
          {/* Category Dropdown */}
          <div className="filter-field-item">
            <label htmlFor="filter-category" className="filter-field-label">
              Category
            </label>
            <select
              id="filter-category"
              className="filter-input-card"
              value={urlCategory}
              onChange={handleCategoryChange}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* City / Location Dropdown & Input */}
          <div className="filter-field-item">
            <label htmlFor="filter-location" className="filter-field-label">
              City / Location
            </label>
            <div className="filter-input-card-with-icon">
              <MapPin size={16} className="filter-card-icon" aria-hidden="true" />
              <select
                id="filter-city-select"
                className="filter-input-card has-icon"
                value={urlLocation || 'All Cities'}
                onChange={(e) => handleCitySelect(e.target.value)}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Filter */}
          <div className="filter-field-item">
            <label htmlFor="filter-date" className="filter-field-label">
              Event Date
            </label>
            <input
              id="filter-date"
              type="date"
              className="filter-input-card"
              value={urlDate}
              onChange={handleDateChange}
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="filter-field-item">
            <label htmlFor="filter-sort" className="filter-field-label">
              Sort By
            </label>
            <select
              id="filter-sort"
              className="filter-input-card"
              value={urlSort}
              onChange={handleSortChange}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters (Displayed when filters are active) */}
        {hasActiveFilters && (
          <div className="filters-summary-bar">
            <div className="filter-count-badge">
              Active filters applied{' '}
              {pagination.totalEvents > 0 && (
                <>
                  — Showing <strong>{pagination.totalEvents}</strong>{' '}
                  {pagination.totalEvents === 1 ? 'event' : 'events'}
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn-filter-reset"
              id="btn-clear-filters"
            >
              <RotateCcw size={14} />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </section>

      {/* 4. Events Display Content */}
      <section className="events-content-area" aria-live="polite">
        {loading ? (
          <Loading count={6} message="Loading events..." />
        ) : error ? (
          <div className="error-state-card" role="alert">
            <h3 className="error-state-title">Unable to load events</h3>
            <p className="error-state-desc">{error || 'Please try again.'}</p>
            <button
              type="button"
              onClick={fetchEvents}
              className="btn-primary"
              id="btn-retry-events"
            >
              Try Again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon-wrap" aria-hidden="true">
              <Search size={28} />
            </div>
            <h3 className="empty-state-title">No Events Found</h3>
            <p className="empty-state-desc">Try changing your search or filters.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-secondary"
                id="btn-empty-clear-filters"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="events-display-grid" id="events-grid">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <nav className="pagination-container" aria-label="Events pagination">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  aria-label="Previous page"
                >
                  ←
                </button>

                {Array.from({ length: pagination.totalPages }, (_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === pagination.page;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      className={`pagination-btn ${isActive ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                      aria-label={`Page ${pageNum}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="pagination-btn"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  aria-label="Next page"
                >
                  →
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Events;
