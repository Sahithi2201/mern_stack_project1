import React, { useMemo } from 'react';

/**
 * SeatGrid Component
 * Renders the interactive visual seat map for an event.
 * Uses authoritative seat data (event.seats) from the backend.
 *
 * @param {Array} seats - Array of seat objects { seatNumber, status }
 * @param {Array} selectedSeats - Array of currently selected seatNumber strings
 * @param {Function} onToggleSeat - Handler called when an available seat is clicked
 * @param {string} limitMessage - Optional message displayed when seat selection limit is reached
 * @param {boolean} disabled - Whether interactions are disabled (e.g. while submitting)
 */
const SeatGrid = ({
  seats = [],
  selectedSeats = [],
  onToggleSeat,
  limitMessage = '',
  disabled = false,
}) => {
  // Set for fast O(1) lookup of selected seat status
  const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);

  // Group seats by their row prefix (e.g., "A", "B", "C") preserving backend order
  const groupedRows = useMemo(() => {
    const rows = new Map();

    seats.forEach((seat) => {
      // Match leading alphabetic characters for the row label (e.g., 'A1' -> 'A')
      const match = seat.seatNumber.match(/^([A-Za-z]+)/);
      const rowLabel = match ? match[1].toUpperCase() : 'General';

      if (!rows.has(rowLabel)) {
        rows.set(rowLabel, []);
      }
      rows.get(rowLabel).push(seat);
    });

    return Array.from(rows.entries()).map(([rowLabel, rowSeats]) => ({
      rowLabel,
      seats: rowSeats,
    }));
  }, [seats]);

  return (
    <div className="seat-arena-card" id="seat-selection-arena">
      {/* Visual Screen / Stage Indicator */}
      <div className="screen-indicator-wrapper" aria-hidden="true">
        <div className="cinema-screen-bar"></div>
        <span className="cinema-screen-label">Screen / Stage This Way</span>
      </div>

      {/* Accessible Visual Seat Legend */}
      <div className="seat-legend-container" role="region" aria-label="Seat Legend">
        <div className="legend-item">
          <span className="legend-swatch swatch-available" aria-hidden="true">□</span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-selected" aria-hidden="true">✓</span>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-booked" aria-hidden="true">✕</span>
          <span>Booked</span>
        </div>
      </div>

      {/* Seat Rows Arena */}
      <div
        className="seats-scroll-container"
        role="group"
        aria-label="Auditorium seating layout"
      >
        {groupedRows.map(({ rowLabel, seats: rowSeats }) => (
          <div key={rowLabel} className="seat-row" role="row">
            {/* Left Row Indicator */}
            <span className="seat-row-label" aria-hidden="true">
              {rowLabel}
            </span>

            {/* Row Seat Buttons */}
            <div className="seat-row-group">
              {rowSeats.map((seat) => {
                const isBooked = seat.status === 'BOOKED';
                const isSelected = selectedSet.has(seat.seatNumber);

                let statusLabel = 'available';
                let buttonClass = 'seat-button seat-available';

                if (isBooked) {
                  statusLabel = 'booked';
                  buttonClass = 'seat-button seat-booked';
                } else if (isSelected) {
                  statusLabel = 'selected';
                  buttonClass = 'seat-button seat-selected';
                }

                return (
                  <button
                    key={seat.seatNumber}
                    type="button"
                    id={`seat-${seat.seatNumber}`}
                    className={buttonClass}
                    disabled={isBooked || disabled}
                    aria-label={`Seat ${seat.seatNumber}, ${statusLabel}`}
                    aria-pressed={isSelected}
                    onClick={() => onToggleSeat(seat.seatNumber)}
                  >
                    <span>{seat.seatNumber}</span>
                    {isBooked && (
                      <span className="seat-booked-mark" aria-hidden="true">
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Row Indicator */}
            <span className="seat-row-label" aria-hidden="true">
              {rowLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Seat Selection Limit Warning */}
      {limitMessage && (
        <div className="seat-limit-warning" role="alert" id="seat-limit-warning">
          <span aria-hidden="true">⚠️</span>
          <span>{limitMessage}</span>
        </div>
      )}
    </div>
  );
};

export default SeatGrid;
