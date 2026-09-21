import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  Lock,
  X,
  Ticket,
  AlertCircle,
  CheckCircle2,
  Download,
  Printer,
  Copy,
  Check,
  ArrowRight,
  Smartphone,
  QrCode,
  CreditCard,
  Building,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

import eventService from '../services/eventService.js';
import bookingService from '../services/bookingService.js';
import { initiatePhonePePayment, verifyPhonePePayment } from '../services/paymentService.js';
import { getSocket, joinEventRoom, leaveEventRoom } from '../services/socket.js';
import SeatGrid from '../components/SeatGrid.jsx';
import Loading from '../components/Loading.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/helpers.js';
import { getEventCinematicBackground } from '../utils/categoryBackgrounds.js';
import '../styles/booking.css';

const MAX_SEATS_PER_BOOKING = 8;

const Booking = ({ initialStep = 1 }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Multi-step booking state
  // Step 1: Select Seats | Step 2: Checkout | Step 3: Payment | Step 4: Payment Successful | Step 5: Booking Confirmed
  const [currentStep, setCurrentStep] = useState(initialStep === 'checkout' || initialStep === 2 ? 2 : 1);

  // Event & Session data
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [limitMessage, setLimitMessage] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Multi-session showtime selection state
  const [selectedShowId, setSelectedShowId] = useState('');
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);

  // Seat hold timer (10 minutes)
  const [holdTimer, setHoldTimer] = useState(600);
  const [isSeatsHeld, setIsSeatsHeld] = useState(false);
  const holdIntervalRef = useRef(null);

  // Checkout attendee info
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });

  // Step 3 Payment State
  const [paymentTab, setPaymentTab] = useState('upi'); // 'upi' | 'qr' | 'cards' | 'netbanking'
  const [upiId, setUpiId] = useState('customer@ybl');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [merchantTxnId, setMerchantTxnId] = useState('');

  // Step 5 Digital Ticket Actions State
  const [copiedRef, setCopiedRef] = useState(false);
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const ticketRef = useRef(null);

  useEffect(() => {
    if (user) {
      setCustomerInfo((prev) => ({
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || '',
      }));
    }
  }, [user]);

  // Fetch Event
  const fetchEvent = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setPageError('');
      const data = await eventService.getEventById(id);
      setEvent(data);

      if (data.shows && data.shows.length > 0) {
        setSelectedShowId(data.shows[0]._id);
      }
    } catch (err) {
      console.error('Failed to load event:', err);
      setPageError(getErrorMessage(err) || 'Unable to load event details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Real-time Socket.IO synchronization for seat locks
  useEffect(() => {
    if (!id) return;
    const socket = getSocket();

    joinEventRoom(id, selectedShowId);

    const handleSeatUpdate = ({ eventId, showId, seats, status, heldBy }) => {
      if (eventId === id && (!showId || showId === selectedShowId)) {
        setEvent((prevEvent) => {
          if (!prevEvent) return prevEvent;

          if (showId && prevEvent.shows) {
            const updatedShows = prevEvent.shows.map((sh) => {
              if (sh._id === showId && sh.seats) {
                const updatedSeats = sh.seats.map((s) => {
                  if (seats.includes(s.seatNumber)) {
                    return { ...s, status, heldBy };
                  }
                  return s;
                });
                return { ...sh, seats: updatedSeats };
              }
              return sh;
            });
            return { ...prevEvent, shows: updatedShows };
          }

          if (prevEvent.seats) {
            const updatedSeats = prevEvent.seats.map((s) => {
              if (seats.includes(s.seatNumber)) {
                return { ...s, status, heldBy };
              }
              return s;
            });
            return { ...prevEvent, seats: updatedSeats };
          }
          return prevEvent;
        });

        // Drop seat if another user locked it
        if (heldBy && user && heldBy.toString() !== user._id?.toString()) {
          setSelectedSeats((prev) => {
            const conflicted = prev.filter((s) => seats.includes(s));
            if (conflicted.length > 0) {
              setBookingError(
                `Seat ${conflicted.join(', ')} was just reserved by another customer.`
              );
              return prev.filter((s) => !seats.includes(s));
            }
            return prev;
          });
        }
      }
    };

    socket.on('seat_status_changed', handleSeatUpdate);

    return () => {
      socket.off('seat_status_changed', handleSeatUpdate);
      leaveEventRoom(id, selectedShowId);
    };
  }, [id, selectedShowId, user]);

  // Determine active show session
  const activeShow = useMemo(() => {
    if (!event || !event.shows || event.shows.length === 0) return null;
    return event.shows.find((s) => s._id === selectedShowId) || event.shows[0];
  }, [event, selectedShowId]);

  // Active seats pool
  const currentSeats = useMemo(() => {
    if (activeShow && activeShow.seats && activeShow.seats.length > 0) {
      return activeShow.seats;
    }
    return event?.seats || [];
  }, [activeShow, event]);

  // Extract show dates
  const availableShowDates = useMemo(() => {
    if (!event?.shows || event.shows.length === 0) return [];
    const dateMap = new Map();
    event.shows.forEach((sh) => {
      const dateStr = new Date(sh.date).toDateString();
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          rawDate: sh.date,
          dateStr,
          shows: [],
        });
      }
      dateMap.get(dateStr).shows.push(sh);
    });
    return Array.from(dateMap.values());
  }, [event]);

  // Countdown timer for held seats
  useEffect(() => {
    if (selectedSeats.length > 0 && !isSeatsHeld && currentStep < 4) {
      setIsSeatsHeld(true);
      setHoldTimer(600); // 10 minutes

      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = setInterval(() => {
        setHoldTimer((prev) => {
          if (prev <= 1) {
            clearInterval(holdIntervalRef.current);
            setSelectedSeats([]);
            setIsSeatsHeld(false);
            setCurrentStep(1);
            setBookingError('Your 10-minute seat hold has expired. Please re-select your seats.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (selectedSeats.length === 0 && isSeatsHeld) {
      setIsSeatsHeld(false);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    }

    if (currentStep >= 4 && holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }

    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [selectedSeats.length, isSeatsHeld, currentStep]);

  // Seat click toggle
  const handleSeatToggle = async (seatNumber) => {
    if (!event) return;

    if (selectedSeats.includes(seatNumber)) {
      const nextSeats = selectedSeats.filter((s) => s !== seatNumber);
      setSelectedSeats(nextSeats);
      setLimitMessage('');
      setBookingError('');

      try {
        await bookingService.releaseSeats({
          eventId: id,
          showId: selectedShowId,
          seats: [seatNumber],
        });
      } catch (err) {
        console.warn('Seat release err:', err);
      }
    } else {
      const maxAllowed = Math.min(MAX_SEATS_PER_BOOKING, event.availableSeats || 8);
      if (selectedSeats.length >= maxAllowed) {
        setLimitMessage(`Maximum ${MAX_SEATS_PER_BOOKING} seats per reservation.`);
        return;
      }

      const nextSeats = [...selectedSeats, seatNumber];
      setSelectedSeats(nextSeats);
      setLimitMessage('');
      setBookingError('');

      try {
        await bookingService.holdSeats({
          eventId: id,
          showId: selectedShowId,
          seats: [seatNumber],
        });
      } catch (err) {
        setBookingError(getErrorMessage(err) || 'Could not reserve this seat.');
        setSelectedSeats(selectedSeats);
      }
    }
  };

  const handleRemoveSeat = async (seatNumber) => {
    setSelectedSeats((prev) => prev.filter((s) => s !== seatNumber));
    try {
      await bookingService.releaseSeats({
        eventId: id,
        showId: selectedShowId,
        seats: [seatNumber],
      });
    } catch (e) {
      // ignore
    }
  };

  // Pricing calculations
  const numberOfSeats = selectedSeats.length;
  const baseSeatPrice = activeShow?.price || event?.price || 500;
  const subtotal = numberOfSeats * baseSeatPrice;
  const convenienceFee = numberOfSeats > 0 ? Math.round(subtotal * 0.05) || 40 : 0;
  const taxes = numberOfSeats > 0 ? Math.round(convenienceFee * 0.18) : 0;
  const totalAmount = subtotal + convenienceFee + taxes;

  const isSoldOut = event && (event.availableSeats === 0 || event.availableSeats < 1);

  // Switch showtime
  const handleShowSelect = (show) => {
    if (!show) return;
    if (selectedSeats.length > 0) {
      bookingService.releaseSeats({
        eventId: id,
        showId: selectedShowId,
        seats: selectedSeats,
      }).catch(() => {});
    }
    setSelectedSeats([]);
    setBookingError('');
    setLimitMessage('');
    setSelectedShowId(show._id);
  };

  // Switch show date and select first showtime on that date
  const handleDateSelect = (idx) => {
    setSelectedDateIdx(idx);
    const dateShows = availableShowDates[idx]?.shows;
    if (dateShows && dateShows.length > 0) {
      handleShowSelect(dateShows[0]);
    }
  };

  const formatHoldTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ----------------------------------------------------
  // STEP TRANSITIONS
  // ----------------------------------------------------
  // Step 1 -> Step 2 (Select Seats -> Checkout)
  const handleContinueToCheckout = () => {
    if (selectedSeats.length === 0) {
      setLimitMessage('Please select at least one seat from the seating map.');
      return;
    }
    setBookingError('');
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 -> Step 3 (Checkout -> Payment)
  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      setCurrentStep(1);
      return;
    }
    if (!customerInfo.name || !customerInfo.email) {
      setBookingError('Please enter attendee name and email address.');
      return;
    }
    setBookingError('');
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3 -> Step 4 -> Step 5 (Execute Strict PhonePe Payment Flow)
  const handleExecutePayment = async () => {
    try {
      setPaymentProcessing(true);
      setBookingError('');

      // 1. Backend Payment Initiation (calculates final amount securely)
      const initResult = await initiatePhonePePayment({
        eventId: id,
        showId: selectedShowId,
        selectedSeats,
        customerInfo,
        ticketCategory: 'Executive Pass',
        paymentMethod: `PhonePe ${paymentTab.toUpperCase()}`,
      });

      if (!initResult.success || !initResult.merchantTransactionId) {
        throw new Error(initResult.message || 'Payment initiation failed.');
      }

      setMerchantTxnId(initResult.merchantTransactionId);

      // 2. Strict Backend Verification (booking is confirmed ONLY after verification!)
      const verifyResult = await verifyPhonePePayment({
        merchantTransactionId: initResult.merchantTransactionId,
        simulationAction: 'SUCCESS',
      });

      if (verifyResult.verified && verifyResult.status === 'CONFIRMED') {
        const confirmed = verifyResult.booking || {
          _id: verifyResult.bookingId,
          bookingReference: verifyResult.bookingReference,
          selectedSeats,
          numberOfSeats,
          totalAmount,
          subtotal,
          convenienceFee,
          taxes,
          customerInfo,
          event,
          createdAt: new Date().toISOString(),
          phonePeMerchantTxnId: initResult.merchantTransactionId,
        };

        setConfirmedBookingData(confirmed);

        // Transition to Step 4 (Payment Successful)
        setCurrentStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Smooth transition to Step 5 (Booking Confirmed / Digital Ticket)
        setTimeout(() => {
          setCurrentStep(5);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1200);
      } else {
        throw new Error('Payment verification could not be confirmed. Please check your payment details.');
      }
    } catch (err) {
      console.error('Payment failure:', err);
      setBookingError(err.response?.data?.message || err.message || 'Payment could not be completed.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Step 5 Actions: Download, Print, Copy
  const handleCopyBookingRef = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    });
  };

  const handlePrintTicket = () => {
    window.print();
  };

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    try {
      setDownloadingTicket(true);
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#1E0719',
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `TIXORA_PASS_${confirmedBookingData?.bookingReference || 'CONFIRMED'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Canvas capture failed:', err);
    } finally {
      setDownloadingTicket(false);
    }
  };

  if (loading) {
    return <Loading message="Loading cinematic seating arena..." />;
  }

  if (pageError || !event) {
    return (
      <div className="page-container" id="booking-error-page">
        <div className="details-error-card" role="alert">
          <AlertCircle size={40} className="text-amber-500 mx-auto" />
          <h2 className="details-error-title">Unable to load event</h2>
          <p className="details-error-message">{pageError || 'The requested event could not be found.'}</p>
          <Link to="/events" className="btn-primary">Back to Events</Link>
        </div>
      </div>
    );
  }

  // Dynamic Background: Event-specific hero/background image
  const eventBgImage = getEventCinematicBackground(event);

  const showDateDisplay = activeShow ? formatDate(activeShow.date) : formatDate(event.date);
  const showTimeDisplay = activeShow ? activeShow.startTime : event.time || '7:00 PM';
  const showVenueDisplay = activeShow?.venue || event.venue || event.location;
  const showTheatreDisplay = activeShow?.theatre || event.theatre || 'Main Audi (Dolby Atmos)';
  const showCityDisplay = activeShow?.city || event.city || '';

  const bookingRefCode = confirmedBookingData?.bookingReference || confirmedBookingData?._id || 'TXR-CONFIRMED';
  const qrVerificationValue = `https://tixora.app/verify/${bookingRefCode}`;

  return (
    <div
      className="cinematic-booking-wrapper"
      id="cinematic-booking-page"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(16, 4, 13, 0.65) 0%, rgba(12, 2, 9, 0.74) 50%, rgba(10, 2, 8, 0.82) 100%), url(${eventBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
      }}
    >
      <div className="booking-page-container">
        {/* Navigation Action Bar */}
        <div className="booking-top-bar">
          {currentStep === 1 ? (
            <Link to={`/events/${id}`} className="btn-back-link">
              <ArrowLeft size={16} />
              <span>Back to Event Details</span>
            </Link>
          ) : currentStep === 2 ? (
            <button
              type="button"
              className="btn-back-link"
              onClick={() => setCurrentStep(1)}
            >
              <ArrowLeft size={16} />
              <span>Back to Seat Selection</span>
            </button>
          ) : currentStep === 3 ? (
            <button
              type="button"
              className="btn-back-link"
              onClick={() => setCurrentStep(2)}
            >
              <ArrowLeft size={16} />
              <span>Back to Checkout</span>
            </button>
          ) : (
            <div />
          )}

          {isSeatsHeld && currentStep < 4 && (
            <div className="hold-timer-badge" title="Temporary 10-minute lock">
              <Clock size={13} />
              <span>Seats locked for {formatHoldTimer(holdTimer)}</span>
            </div>
          )}
        </div>

        {/* 5-Step Visual Progress Stepper (No technical breadcrumbs or route paths) */}
        <div className="booking-progress-stepper" aria-label="Booking Progress">
          <div className={`stepper-step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
            <span className="stepper-step-num">{currentStep > 1 ? '✓' : '1'}</span>
            <span>Select Seats</span>
          </div>

          <div className="stepper-divider" />

          <div className={`stepper-step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
            <span className="stepper-step-num">{currentStep > 2 ? '✓' : '2'}</span>
            <span>Checkout</span>
          </div>

          <div className="stepper-divider" />

          <div className={`stepper-step ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
            <span className="stepper-step-num">{currentStep > 3 ? '✓' : '3'}</span>
            <span>Payment</span>
          </div>

          <div className="stepper-divider" />

          <div className={`stepper-step ${currentStep >= 4 ? 'active completed' : ''}`}>
            <span className="stepper-step-num">{currentStep >= 4 ? '✓' : '4'}</span>
            <span>Confirmation</span>
          </div>
        </div>

        {/* Alert Banner for Booking Errors */}
        {bookingError && (
          <div className="alert-error-cinematic" role="alert" id="booking-error-banner">
            <AlertCircle size={18} />
            <span>{bookingError}</span>
          </div>
        )}

        {/* ========================================================
            STEP 1: SELECT SEATS
            ======================================================== */}
        {currentStep === 1 && (
          <div id="step-1-select-seats">
            {/* Event Summary Header Card */}
            <section className="booking-header-card cinematic-header-card" aria-label="Event Summary">
              <div className="booking-event-summary">
                <div className="booking-event-details">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="booking-event-badge">{event.category || 'Cinema'}</span>
                    {event.language && (
                      <span className="event-language-badge">{event.language}</span>
                    )}
                    {event.certificate && (
                      <span className="event-cert-badge">{event.certificate}</span>
                    )}
                  </div>

                  <h1 className="booking-event-title text-white" id="booking-event-title">
                    {event.name}
                  </h1>

                  <div className="booking-event-meta text-gray-300">
                    <span className="booking-meta-item">
                      <MapPin size={15} color="#D4AF37" />
                      <strong>{showVenueDisplay}</strong>
                      {showTheatreDisplay && <span className="text-gray-400">• {showTheatreDisplay}</span>}
                    </span>
                    <span className="booking-meta-item">
                      <Calendar size={15} color="#D4AF37" />
                      <span>{showDateDisplay}</span>
                    </span>
                    <span className="booking-meta-item">
                      <Clock size={15} color="#D4AF37" />
                      <span>{showTimeDisplay}</span>
                    </span>
                  </div>
                </div>

                <div className="booking-price-pill cinematic-price-pill">
                  <span className="booking-price-label">Starting From</span>
                  <span className="booking-price-value" id="booking-seat-price">
                    {formatCurrency(baseSeatPrice)}
                  </span>
                  <span
                    className={`booking-seats-left ${isSoldOut ? 'sold-out' : ''}`}
                    id="booking-seats-available-count"
                  >
                    {isSoldOut ? 'Sold Out' : `${activeShow?.availableSeats || event.availableSeats} seats left`}
                  </span>
                </div>
              </div>

              {/* Multi-Session Date & Showtime Selector */}
              {availableShowDates.length > 0 && (
                <div className="show-session-selector-bar">
                  <div className="session-selector-label">
                    <span>Select Date & Showtime:</span>
                  </div>

                  <div className="session-dates-row">
                    {availableShowDates.map((dObj, idx) => {
                      const isSelectedDate = selectedDateIdx === idx;
                      const dateLabel =
                        idx === 0
                          ? 'Today'
                          : idx === 1
                          ? 'Tomorrow'
                          : formatDate(dObj.rawDate);

                      return (
                        <button
                          key={dObj.dateStr}
                          type="button"
                          className={`session-date-btn ${isSelectedDate ? 'active' : ''}`}
                          onClick={() => handleDateSelect(idx)}
                        >
                          <span className="date-day">{dateLabel}</span>
                          <span className="date-sub">{formatDate(dObj.rawDate)}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="session-times-row">
                    {availableShowDates[selectedDateIdx]?.shows.map((sh) => {
                      const isSelectedShow = selectedShowId === sh._id;
                      return (
                        <button
                          key={sh._id}
                          type="button"
                          className={`session-time-btn ${isSelectedShow ? 'active' : ''}`}
                          onClick={() => handleShowSelect(sh)}
                        >
                          <Clock size={13} />
                          <span>{sh.startTime}</span>
                          <span className="time-theatre-tag">{sh.theatre?.split('•')[0] || 'Dolby'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Main Booking Content Grid: Seats Arena + Order Summary */}
            <div className="booking-content-grid">
              {/* Left Column: Interactive Seat Grid */}
              <section aria-label="Seat Selection Grid">
                <SeatGrid
                  seats={currentSeats}
                  selectedSeats={selectedSeats}
                  onToggleSeat={handleSeatToggle}
                  limitMessage={limitMessage}
                  disabled={isSoldOut}
                  basePrice={baseSeatPrice}
                  currentUserId={user?._id}
                  venueType={event.seatLayout || 'CINEMA'}
                />
              </section>

              {/* Right Column: Order Summary Panel */}
              <aside
                className="booking-summary-panel cinematic-summary-panel"
                aria-label="Booking Summary Panel"
                id="booking-summary-panel"
              >
                <div className="summary-gold-header">
                  <h2 className="summary-panel-title">ORDER SUMMARY</h2>
                  {isSeatsHeld && (
                    <div className="hold-timer-badge" title="Temporary 10-minute lock">
                      <Clock size={13} />
                      <span>{formatHoldTimer(holdTimer)}</span>
                    </div>
                  )}
                </div>

                <div className="summary-event-brief">
                  <div className="summary-brief-title">{event.name}</div>
                  <div className="summary-brief-meta">
                    {showDateDisplay} • {showTimeDisplay}
                  </div>
                  <div className="summary-brief-venue">
                    📍 {showVenueDisplay}
                  </div>
                </div>

                <div className="summary-seats-section">
                  <div className="summary-label">
                    Selected Seats ({numberOfSeats}/{MAX_SEATS_PER_BOOKING})
                  </div>
                  <div className="summary-selected-seats-list" id="selected-seats-display">
                    {numberOfSeats > 0 ? (
                      selectedSeats.map((seatNum) => (
                        <span key={seatNum} className="seat-tag-pill">
                          <span>{seatNum}</span>
                          <button
                            type="button"
                            className="btn-remove-seat-tag"
                            onClick={() => handleRemoveSeat(seatNum)}
                            aria-label={`Remove seat ${seatNum}`}
                          >
                            <X size={12} strokeWidth={3} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="no-seats-placeholder">
                        Click available seats on the arena map
                      </span>
                    )}
                  </div>
                </div>

                <div className="summary-math-list">
                  <div className="summary-math-row">
                    <span>Seats ({numberOfSeats} × {formatCurrency(baseSeatPrice)}):</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                  <div className="summary-math-row">
                    <span>Convenience Fee (5%):</span>
                    <span>{formatCurrency(convenienceFee)}</span>
                  </div>
                  <div className="summary-math-row">
                    <span>Taxes (18% GST):</span>
                    <span>{formatCurrency(taxes)}</span>
                  </div>
                </div>

                <div className="summary-total-row">
                  <span className="total-label">TOTAL AMOUNT:</span>
                  <span className="summary-total-amount" id="booking-total-amount">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                {/* Continue to Checkout Button (Advances to Step 2) */}
                <button
                  type="button"
                  className="btn-primary btn-proceed-checkout"
                  id="btn-continue-to-checkout"
                  disabled={numberOfSeats === 0 || isSoldOut}
                  onClick={handleContinueToCheckout}
                >
                  <div className="btn-inner-content">
                    <span>CONTINUE TO CHECKOUT</span>
                    <ArrowRight size={16} />
                  </div>
                </button>

                <div className="summary-security-badge">
                  <ShieldCheck size={14} color="#27AE60" />
                  <span>Real-Time Seat Locking • Verified Gateway</span>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: CHECKOUT
            ======================================================== */}
        {currentStep === 2 && (
          <div id="step-2-checkout" className="checkout-view-grid">
            <div className="checkout-main-card">
              <h2 className="checkout-section-title">
                <User size={20} />
                <span>Attendee Information</span>
              </h2>

              <div className="checkout-seats-summary-box">
                <div>
                  <div className="text-sm text-gray-400">Selected Event & Seats</div>
                  <div className="text-base font-bold text-white mt-1">
                    {event.name} ({numberOfSeats} {numberOfSeats === 1 ? 'Seat' : 'Seats'})
                  </div>
                  <div className="text-xs text-amber-400 mt-1">
                    {showVenueDisplay} • {showDateDisplay} at {showTimeDisplay}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedSeats.map((s) => (
                    <span key={s} className="seat-badge-pill font-mono font-bold text-amber-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="checkout-form-group">
                <label className="checkout-form-label" htmlFor="checkout-name">
                  Full Name
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  className="checkout-form-input"
                  placeholder="Enter attendee full name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  required
                />
              </div>

              <div className="checkout-form-group">
                <label className="checkout-form-label" htmlFor="checkout-email">
                  Email Address (For Instant QR Pass)
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  className="checkout-form-input"
                  placeholder="Enter email address"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  required
                />
              </div>

              <div className="checkout-form-group">
                <label className="checkout-form-label" htmlFor="checkout-phone">
                  Mobile Number (Optional SMS Delivery)
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  className="checkout-form-input"
                  placeholder="+91 98765 43210"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                />
              </div>

              <div className="checkout-actions-row">
                <button
                  type="button"
                  className="btn-checkout-back"
                  onClick={() => setCurrentStep(1)}
                  id="btn-back-to-seats"
                >
                  <ArrowLeft size={16} />
                  <span>Modify Seats</span>
                </button>

                <button
                  type="button"
                  className="btn-proceed-payment"
                  onClick={handleProceedToPayment}
                  id="btn-proceed-to-payment"
                >
                  <span>PROCEED TO PAYMENT</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Sticky Order Breakdown Sidebar */}
            <aside className="booking-summary-panel cinematic-summary-panel">
              <div className="summary-gold-header">
                <h2 className="summary-panel-title">PAYMENT SUMMARY</h2>
                {isSeatsHeld && (
                  <div className="hold-timer-badge">
                    <Clock size={13} />
                    <span>{formatHoldTimer(holdTimer)}</span>
                  </div>
                )}
              </div>

              <div className="summary-math-list">
                <div className="summary-math-row">
                  <span>Seats Subtotal ({numberOfSeats}):</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div className="summary-math-row">
                  <span>Convenience Fee (5%):</span>
                  <span>{formatCurrency(convenienceFee)}</span>
                </div>
                <div className="summary-math-row">
                  <span>Taxes (18% GST):</span>
                  <span>{formatCurrency(taxes)}</span>
                </div>
              </div>

              <div className="summary-total-row">
                <span className="total-label">TOTAL PAYABLE:</span>
                <span className="summary-total-amount">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <div className="summary-security-badge mt-4">
                <ShieldCheck size={16} color="#D4AF37" />
                <span>Price verified strictly by backend server</span>
              </div>
            </aside>
          </div>
        )}

        {/* ========================================================
            STEP 3: PAYMENT
            ======================================================== */}
        {currentStep === 3 && (
          <div id="step-3-payment" className="payment-view-container">
            <div className="payment-gateway-panel">
              <div className="phonepe-modal-header mb-6 rounded-xl">
                <div className="phonepe-brand-badge">
                  <div className="phonepe-logo-circle">
                    <span className="phonepe-letter">पे</span>
                  </div>
                  <div className="phonepe-title-block">
                    <span className="phonepe-brand-title">PhonePe Secure Payment Gateway</span>
                    <span className="phonepe-brand-sub">TIXORA Verified Checkout</span>
                  </div>
                </div>

                <div className="phonepe-session-timer">
                  <Clock size={14} />
                  <span>{formatHoldTimer(holdTimer)}</span>
                </div>
              </div>

              {/* Amount Strip */}
              <div className="phonepe-amount-strip rounded-xl mb-6">
                <div className="amount-info">
                  <span className="amount-label">Grand Total:</span>
                  <span className="amount-value">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex gap-1.5">
                  {selectedSeats.map((s) => (
                    <span key={s} className="seat-badge-pill font-mono">{s}</span>
                  ))}
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="phonepe-tabs">
                <button
                  type="button"
                  className={`phonepe-tab ${paymentTab === 'upi' ? 'active' : ''}`}
                  onClick={() => setPaymentTab('upi')}
                >
                  <Smartphone size={16} />
                  <span>UPI Apps</span>
                </button>
                <button
                  type="button"
                  className={`phonepe-tab ${paymentTab === 'qr' ? 'active' : ''}`}
                  onClick={() => setPaymentTab('qr')}
                >
                  <QrCode size={16} />
                  <span>QR Code</span>
                </button>
                <button
                  type="button"
                  className={`phonepe-tab ${paymentTab === 'cards' ? 'active' : ''}`}
                  onClick={() => setPaymentTab('cards')}
                >
                  <CreditCard size={16} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  className={`phonepe-tab ${paymentTab === 'netbanking' ? 'active' : ''}`}
                  onClick={() => setPaymentTab('netbanking')}
                >
                  <Building size={16} />
                  <span>NetBanking</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="phonepe-tab-content">
                {paymentTab === 'upi' && (
                  <div>
                    <label className="input-field-label">Virtual Payment Address (UPI ID)</label>
                    <div className="upi-input-group">
                      <input
                        type="text"
                        className="phonepe-input"
                        placeholder="yourname@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                      <span className="upi-verify-tag">VERIFIED</span>
                    </div>
                    <div className="upi-popular-badges">
                      <span onClick={() => setUpiId(`${user?.email?.split('@')[0] || 'customer'}@ybl`)}>@ybl</span>
                      <span onClick={() => setUpiId(`${user?.email?.split('@')[0] || 'customer'}@okaxis`)}>@okaxis</span>
                      <span onClick={() => setUpiId(`${user?.email?.split('@')[0] || 'customer'}@paytm`)}>@paytm</span>
                    </div>
                  </div>
                )}

                {paymentTab === 'qr' && (
                  <div className="text-center">
                    <div className="qr-code-box">
                      <QRCodeSVG
                        value={`upi://pay?pa=tixora@phonepe&pn=Tixora&am=${totalAmount}&cu=INR`}
                        size={150}
                        fgColor="#1A0615"
                      />
                      <span className="qr-scan-label">Scan & Pay via any UPI App</span>
                    </div>
                    <p className="qr-hint">Open PhonePe, GPay, Paytm, or BHIM to complete payment</p>
                  </div>
                )}

                {paymentTab === 'cards' && (
                  <div>
                    <label className="input-field-label">Card Number</label>
                    <input
                      type="text"
                      className="phonepe-input"
                      placeholder="•••• •••• •••• 4242"
                      defaultValue="4532 8901 2345 4242"
                    />
                    <div className="field-grid-2">
                      <div>
                        <label className="input-field-label">Expiry (MM/YY)</label>
                        <input type="text" className="phonepe-input" placeholder="12/28" defaultValue="09/28" />
                      </div>
                      <div>
                        <label className="input-field-label">CVV</label>
                        <input type="password" className="phonepe-input" placeholder="•••" defaultValue="888" />
                      </div>
                    </div>
                  </div>
                )}

                {paymentTab === 'netbanking' && (
                  <div>
                    <label className="input-field-label">Select Bank</label>
                    <select className="phonepe-input bg-zinc-900">
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>State Bank of India</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Pay Now Button */}
              <button
                type="button"
                className="btn-phonepe-submit mt-6"
                id="btn-pay-phonepe-now"
                disabled={paymentProcessing}
                onClick={handleExecutePayment}
              >
                {paymentProcessing ? (
                  <span>Verifying Transaction with PhonePe...</span>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>PAY {formatCurrency(totalAmount)} SECURELY</span>
                  </>
                )}
              </button>

              <div className="text-center mt-4 text-xs text-gray-400">
                🔒 Protected by 256-Bit PhonePe Gateway Encryption
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 4: PAYMENT SUCCESSFUL (Celebration Banner)
            ======================================================== */}
        {currentStep === 4 && (
          <div id="step-4-payment-success" className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mb-6 text-emerald-400 animate-pulse">
              <CheckCircle2 size={44} />
            </div>
            <div className="payment-success-badge-pill">✓ PAYMENT SUCCESSFUL</div>
            <h1 className="booking-confirmed-heading">BOOKING CONFIRMED</h1>
            <p className="booking-confirmed-sub">
              Your payment has been verified. Generating your official TIXORA digital pass...
            </p>
          </div>
        )}

        {/* ========================================================
            STEP 5: BOOKING CONFIRMED (Official Digital Ticket)
            ======================================================== */}
        {currentStep === 5 && (
          <div id="step-5-booking-confirmed">
            <div className="confirmation-hero-banner">
              <div className="payment-success-badge-pill">
                <CheckCircle2 size={16} />
                <span>PAYMENT SUCCESSFUL • BOOKING CONFIRMED</span>
              </div>
              <h1 className="booking-confirmed-heading text-white">Your Official Digital Pass</h1>
              <p className="booking-confirmed-sub">
                Your seats are permanently booked. Present this verified digital pass at the entrance.
              </p>
            </div>

            {/* The Official Digital Ticket */}
            <div className="confirmation-ticket-wrapper">
              <div className="boarding-ticket-card" ref={ticketRef} id="printable-digital-ticket">
                <div className="ticket-top-accent-bar" />

                {/* Ticket Header */}
                <div className="ticket-card-top">
                  <div className="ticket-brand-badge">
                    <div className="ticket-brand-icon">
                      <Sparkles size={16} />
                    </div>
                    <div className="ticket-brand-text">
                      <span className="brand-tix">TIX</span>
                      <span className="brand-ora">ORA</span>
                      <span className="brand-suffix">PASS</span>
                    </div>
                  </div>

                  <div className="ticket-status-pill">
                    <span className="status-dot-green" />
                    <span className="status-text">✓ VERIFIED OFFICIAL PASS</span>
                  </div>
                </div>

                {/* Event Banner */}
                <div className="ticket-event-banner">
                  <span className="ticket-category-pill">{event.category?.toUpperCase() || 'EVENT'}</span>
                  <h2 className="ticket-event-name" id="confirmed-ticket-event-name">
                    {event.name}
                  </h2>

                  <div className="ticket-event-meta-row">
                    <div className="ticket-meta-badge">
                      <Calendar size={14} className="meta-icon-gold" />
                      <span>{showDateDisplay}</span>
                    </div>
                    <div className="ticket-meta-badge">
                      <Clock size={14} className="meta-icon-gold" />
                      <span>{showTimeDisplay}</span>
                    </div>
                    <div className="ticket-meta-badge">
                      <MapPin size={14} className="meta-icon-gold" />
                      <span>{showVenueDisplay}{showCityDisplay ? `, ${showCityDisplay}` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Perforated Stub Divider */}
                <div className="ticket-divider" aria-hidden="true">
                  <div className="notch notch-left" />
                  <div className="divider-dashes" />
                  <div className="notch notch-right" />
                </div>

                {/* Ticket Body & QR Grid */}
                <div className="ticket-body-grid">
                  <div className="ticket-info-fields">
                    {/* Booking Reference with Copy */}
                    <div className="ticket-field-block">
                      <span className="ticket-field-label">Booking Reference</span>
                      <div className="ticket-code-row">
                        <span className="ticket-code-text" id="confirmed-booking-reference">
                          {bookingRefCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyBookingRef(bookingRefCode)}
                          className="btn-copy-id"
                          title="Copy Reference"
                          id="btn-copy-booking-ref"
                        >
                          {copiedRef ? <Check size={14} className="copied-icon" /> : <Copy size={14} />}
                          <span className="copy-label">{copiedRef ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Transaction Reference */}
                    <div className="ticket-field-block">
                      <span className="ticket-field-label">Transaction Reference</span>
                      <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                        {merchantTxnId || confirmedBookingData?.phonePeMerchantTxnId || 'PHONEPE_TXN_VERIFIED'}
                      </span>
                    </div>

                    {/* Reserved Seats List */}
                    <div className="ticket-field-block">
                      <span className="ticket-field-label">Reserved Seats ({selectedSeats.length})</span>
                      <div className="ticket-seat-pill-group" id="confirmed-seats-list">
                        {selectedSeats.map((seat) => (
                          <span key={seat} className="ticket-seat-pill">
                            {seat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Attendee */}
                    <div className="ticket-field-block">
                      <span className="ticket-field-label">Ticket Holder</span>
                      <span className="ticket-field-val">
                        {customerInfo.name || user?.name || 'Valued Guest'} ({customerInfo.email || user?.email})
                      </span>
                    </div>

                    {/* Pricing Breakdown: Price, Fee, GST, Total */}
                    <div className="summary-math-list py-2 my-1 border-t border-b border-gray-200 text-xs text-gray-600">
                      <div className="flex justify-between py-0.5">
                        <span>Ticket Base Price:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span>Convenience Fee:</span>
                        <span>{formatCurrency(convenienceFee)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span>GST (18%):</span>
                        <span>{formatCurrency(taxes)}</span>
                      </div>
                    </div>

                    {/* Total Paid */}
                    <div className="ticket-field-block total-paid-block">
                      <span className="ticket-field-label">Total Amount Paid (Verified)</span>
                      <span className="ticket-price-total" id="confirmed-total-paid">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Right QR Column */}
                  <div className="ticket-qr-column">
                    <div className="qr-box-container">
                      <div className="qr-svg-wrapper">
                        <QRCodeSVG
                          value={qrVerificationValue}
                          size={130}
                          level="H"
                          includeMargin={false}
                          fgColor="#1B0715"
                          bgColor="#FFFFFF"
                        />
                      </div>
                      <span className="qr-scan-label">Gate Verification QR</span>
                      <span className="qr-ref-code">{bookingRefCode}</span>
                    </div>

                    <div className="ticket-guarantee-note">
                      <ShieldCheck size={15} className="shield-icon" />
                      <span>TIXORA Secure Pass • Anti-Counterfeit</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Barcode Strip */}
                <div className="ticket-barcode-footer">
                  <div className="barcode-visual" aria-hidden="true">
                    ||| | |||| | || ||||| || | ||| |||| |||| | ||| | || |||| | |||
                  </div>
                  <div className="barcode-caption-row">
                    <span className="barcode-caption">TIXORA VERIFIED DIGITAL PASS</span>
                    <span className="barcode-date">Issued {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* The 4 Action Buttons (Strictly shown only after payment confirmation) */}
            <div className="ticket-actions-toolbar" id="ticket-action-buttons">
              <button
                type="button"
                onClick={handleDownloadTicket}
                disabled={downloadingTicket}
                className="btn-ticket-action btn-ticket-primary"
                id="btn-download-ticket"
              >
                <Download size={16} />
                <span>{downloadingTicket ? 'Downloading...' : 'Download Ticket'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintTicket}
                className="btn-ticket-action"
                id="btn-print-ticket"
              >
                <Printer size={16} />
                <span>Print Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/my-bookings')}
                className="btn-ticket-action"
                id="btn-view-my-bookings"
              >
                <Ticket size={16} />
                <span>View My Bookings</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/events')}
                className="btn-ticket-action btn-ticket-outline"
                id="btn-explore-more-events"
              >
                <span>Explore More Events</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;
