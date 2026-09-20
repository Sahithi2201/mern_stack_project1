import React from 'react';

/**
 * Loading Component with Skeleton Event Cards Shimmer
 * Provides immediate visual feedback during catalog fetch without jarring spinners.
 */
const Loading = ({ count = 6, message = 'Curating experiences...' }) => {
  return (
    <div className="skeleton-grid-container" aria-label="Loading events">
      <div className="events-display-grid">
        {Array.from({ length: count }, (_, idx) => (
          <div key={idx} className="skeleton-card" aria-hidden="true">
            <div className="skeleton-media skeleton-shimmer" />
            <div className="skeleton-body">
              <div className="skeleton-line skeleton-title skeleton-shimmer" />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '60%' }} />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '45%' }} />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '30%', marginTop: '8px' }} />
              <div className="skeleton-btn skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
      <p className="sr-only">{message}</p>
    </div>
  );
};

export default Loading;
