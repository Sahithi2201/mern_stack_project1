import React, { useMemo, useState } from 'react';
import { Crown, Check, X, Lock, Info, Sparkles, Shield } from 'lucide-react';

/**
 * SeatGrid Component
 * High-end cinematic seat selection arena.
 * Supports:
 * - AVAILABLE (emerald pearl border)
 * - SELECTED (luxury gold glow + checkmark)
 * - HELD (amber pulse + lock icon, real-time lock by another user)
 * - BOOKED (dark subtle X, disabled)
 * - VIP, Gold, and Silver section tiers
 * - Responsive cinema screen arc with golden glow
 */
const SeatGrid = ({
  seats = [],
  selectedSeats = [],
  onToggleSeat,
  limitMessage = '',
  disabled = false,
  basePrice = 500,
  currentUserId = null,
  venueType = 'CINEMA',
}) => {
  const [hoveredSeat, setHoveredSeat] = useState(null);

  const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);

  // Section tier pricing
  const getRowTier = (rowLabel) => {
    const code = rowLabel.toUpperCase();
    if (code === 'A' || code === 'B') {
      return {
        name: 'VIP Lounge Box',
        tier: 'VIP',
        badgeClass: 'tier-vip',
        price: Math.round(basePrice * 1.35),
      };
    }
    if (code === 'C' || code === 'D' || code === 'E') {
      return {
        name: 'Executive Gold',
        tier: 'Gold',
        badgeClass: 'tier-gold',
        price: basePrice,
      };
    }
    return {
      name: 'Classic Silver',
      tier: 'Silver',
      badgeClass: 'tier-silver',
      price: Math.round(basePrice * 0.85),
    };
  };

  // Group seats by row (A, B, C...)
  const groupedRows = useMemo(() => {
    const rows = new Map();

    seats.forEach((seat) => {
      const match = seat.seatNumber.match(/^([A-Za-z]+)/);
      const rowLabel = match ? match[1].toUpperCase() : 'A';

      if (!rows.has(rowLabel)) {
        rows.set(rowLabel, []);
      }
      rows.get(rowLabel).push(seat);
    });

    return Array.from(rows.entries()).map(([rowLabel, rowSeats]) => {
      const tierInfo = getRowTier(rowLabel);
      return {
        rowLabel,
        seats: rowSeats,
        tierInfo,
      };
    });
  }, [seats, basePrice]);

  return (
    <div className="seat-arena-card cinematic-arena-panel" id="seat-selection-arena">
      {/* Screen / Stage Arc */}
      <div className="screen-indicator-wrapper" aria-hidden="true">
        <div className="cinema-screen-bar" />
        <span className="cinema-screen-label">
          {venueType === 'STADIUM' ? 'PITCH / ARENA BOUNDARY' : venueType === 'CONCERT_ARENA' ? 'MAIN LIVE STAGE' : 'ALL EYES THIS WAY • STAGE / SCREEN'}
        </span>
        <div className="stage-glow-arc" />
      </div>

      {/* 5-State Legend */}
      <div className="seat-legend-container" role="region" aria-label="Seat Legend">
        <div className="legend-item">
          <span className="legend-swatch swatch-available" aria-hidden="true">
            <span className="swatch-seat-cushion" />
          </span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-selected" aria-hidden="true">
            <Check size={12} strokeWidth={3} />
          </span>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-held" aria-hidden="true">
            <Lock size={11} strokeWidth={2.5} />
          </span>
          <span>Held (Live Lock)</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-booked" aria-hidden="true">
            <X size={12} strokeWidth={2.5} />
          </span>
          <span>Booked / Sold</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-vip" aria-hidden="true">
            <Crown size={11} />
          </span>
          <span>VIP Lounge</span>
        </div>
      </div>

      {/* Seating Layout Arena with Section Headers */}
      <div className="seats-scroll-container" role="group" aria-label="Auditorium seating map">
        {groupedRows.map(({ rowLabel, seats: rowSeats, tierInfo }, rowIndex) => {
          const isFirstOfTier =
            rowIndex === 0 || groupedRows[rowIndex - 1].tierInfo.tier !== tierInfo.tier;

          return (
            <React.Fragment key={rowLabel}>
              {isFirstOfTier && (
                <div className={`section-tier-header ${tierInfo.badgeClass}`}>
                  <div className="tier-header-line" />
                  <div className="tier-header-badge">
                    {tierInfo.tier === 'VIP' ? <Crown size={13} /> : <Sparkles size={13} />}
                    <span>{tierInfo.name}</span>
                    <span className="tier-price-tag">₹{tierInfo.price}</span>
                  </div>
                  <div className="tier-header-line" />
                </div>
              )}

              <div className="seat-row" role="row">
                <span className="seat-row-label" aria-hidden="true">
                  {rowLabel}
                </span>

                <div className="seat-row-group">
                  {rowSeats.map((seat) => {
                    const isBooked = seat.status === 'BOOKED';
                    const isSelected = selectedSet.has(seat.seatNumber);
                    const isHeldByOther =
                      seat.status === 'HELD' &&
                      (!seat.heldBy || (currentUserId && seat.heldBy.toString() !== currentUserId.toString()));
                    const isVip = tierInfo.tier === 'VIP';

                    let buttonClass = 'seat-button seat-available';
                    let statusLabel = 'available';

                    if (isBooked) {
                      buttonClass = 'seat-button seat-booked';
                      statusLabel = 'booked';
                    } else if (isSelected) {
                      buttonClass = 'seat-button seat-selected';
                      statusLabel = 'selected';
                    } else if (isHeldByOther) {
                      buttonClass = 'seat-button seat-held';
                      statusLabel = 'held by another guest';
                    } else if (isVip) {
                      buttonClass = 'seat-button seat-available seat-vip';
                    }

                    const isDisabled = isBooked || isHeldByOther || disabled;

                    return (
                      <div
                        key={seat.seatNumber}
                        className="seat-interactive-wrapper"
                        onMouseEnter={() => setHoveredSeat({ ...seat, tierInfo, isHeldByOther })}
                        onMouseLeave={() => setHoveredSeat(null)}
                      >
                        <button
                          type="button"
                          id={`seat-${seat.seatNumber}`}
                          className={buttonClass}
                          disabled={isDisabled}
                          aria-label={`Seat ${seat.seatNumber}, ${tierInfo.tier} tier, ${statusLabel}, ₹${tierInfo.price}`}
                          aria-pressed={isSelected}
                          onClick={() => onToggleSeat(seat.seatNumber)}
                        >
                          <span className="seat-num">{seat.seatNumber}</span>

                          {isSelected && (
                            <span className="seat-selected-check" aria-hidden="true">
                              <Check size={10} strokeWidth={3.5} />
                            </span>
                          )}

                          {isHeldByOther && (
                            <span className="seat-held-lock" aria-hidden="true">
                              <Lock size={9} strokeWidth={2.5} />
                            </span>
                          )}

                          {isBooked && (
                            <span className="seat-booked-x" aria-hidden="true">
                              <X size={10} strokeWidth={2.5} />
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <span className="seat-row-label" aria-hidden="true">
                  {rowLabel}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Live Hover Tooltip Banner */}
      <div className="seat-hover-indicator" aria-live="polite">
        {hoveredSeat ? (
          <div className="hover-seat-badge">
            <Info size={14} className="hover-icon" />
            <span>
              <strong>Seat {hoveredSeat.seatNumber}</strong> • {hoveredSeat.tierInfo.name} •{' '}
              {hoveredSeat.status === 'BOOKED' ? (
                <span className="text-danger">Sold Out</span>
              ) : hoveredSeat.isHeldByOther ? (
                <span className="text-amber-400 font-bold">Temporarily Held (10m hold)</span>
              ) : (
                <span className="text-price">₹{hoveredSeat.tierInfo.price}</span>
              )}
            </span>
          </div>
        ) : (
          <span className="hover-helper-text">
            Hover over any seat to inspect section and price. Click an available seat to lock and reserve.
          </span>
        )}
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
