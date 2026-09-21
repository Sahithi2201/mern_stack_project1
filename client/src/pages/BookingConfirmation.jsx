import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Ticket,
  Calendar,
  MapPin,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
  Printer,
  Download,
  ShieldCheck,
  Clock,
  Sparkles,
  User,
  CreditCard,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import bookingService from '../services/bookingService.js';
import Loading from '../components/Loading.jsx';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/helpers.js';
import { getEventCinematicBackground } from '../utils/categoryBackgrounds.js';
import '../styles/booking.css';

const BookingConfirmation = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef(null);

  useEffect(() => {
    document.title = 'Tixora — Official Verified Digital Pass';
  }, []);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getBookingById(id);
      setBooking(data?.booking || data);
    } catch (err) {
      console.error('Failed to load booking details:', err);
      setError(getErrorMessage(err) || 'Unable to load booking details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const bookingRefCode = booking?.bookingReference || booking?._id || id;

  const handleCopyId = () => {
    if (!bookingRefCode) return;
    navigator.clipboard.writeText(bookingRefCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Download ONLY the ticket card using html2canvas
  const handleDownload = async () => {
    if (!ticketRef.current || !booking) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#1E0719',
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `TIXORA_PASS_${bookingRefCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Canvas capture failed, generating text backup:', err);
      const ticketSummary = `=========================================
TIXORA OFFICIAL DIGITAL PASS
Booking Reference: ${bookingRefCode}
Event: ${booking.event?.name || 'Event'}
Category: ${booking.event?.category || 'Standard'}
Venue: ${booking.event?.venue || booking.event?.location || 'Venue TBA'}
City: ${booking.event?.city || ''}
Date & Time: ${formatDate(booking.event?.date)} at ${booking.event?.time || 'TBA'}
Seats (${booking.selectedSeats?.length || 1}): ${booking.selectedSeats?.join(', ')}
Tier: ${booking.ticketCategory || 'Gold Pass'}
Attendee: ${booking.customerInfo?.name || booking.user?.name || 'Customer'}
Payment: ${booking.paymentMethod || 'PhonePe Verified'}
Txn ID: ${booking.phonePeMerchantTxnId || 'VERIFIED'}
Amount Paid: ${formatCurrency(booking.totalAmount)}
Status: CONFIRMED • PAID
Verification Code: TIXORA-PASS:${bookingRefCode}
=========================================`;

      const blob = new Blob([ticketSummary], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TIXORA_PASS_${bookingRefCode}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <Loading message="Finalizing and verifying your digital ticket..." />;
  }

  if (error || !booking) {
    return (
      <div className="confirmation-page-wrapper" id="confirmation-error-page">
        <div className="details-error-card" role="alert">
          <AlertCircle size={40} className="details-error-icon" />
          <h2 className="details-error-title">Unable to load booking details</h2>
          <p className="details-error-desc">
            {error || 'We could not retrieve your booking receipt.'}
          </p>
          <div className="details-error-actions">
            <button
              type="button"
              onClick={fetchBooking}
              className="btn-primary"
              id="btn-retry-confirmation"
            >
              Retry
            </button>
            <Link to="/my-bookings" className="btn-outline">
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    _id,
    event,
    selectedSeats = [],
    numberOfSeats,
    totalAmount,
    subtotal,
    convenienceFee,
    status,
    bookingDate,
    createdAt,
    ticketCategory = 'Gold Pass',
    customerInfo,
    user,
    paymentMethod = 'PhonePe Verified Payment',
    phonePeMerchantTxnId,
  } = booking;

  const eventName = event?.name || 'Event Reservation';
  const location = event?.venue ? `${event.venue}, ${event.city || event.location}` : (event?.location || 'Venue TBA');
  const eventDate = event?.date;
  const eventTime = event?.time || 'TBA';
  const eventCategory = event?.category || 'Live Event';
  const attendeeName = customerInfo?.name || user?.name || 'Valued Guest';
  const attendeeEmail = customerInfo?.email || user?.email || '';
  const qrVerificationValue = `https://tixora.app/verify/${bookingRefCode}`;

  // Dynamic Event Background: Category-mapped & event-specific
  const dynamicBgImage = getEventCinematicBackground(event);

  return (
    <div
      className="confirmation-page-wrapper"
      id="booking-confirmation-page"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(16, 4, 13, 0.65) 0%, rgba(12, 2, 9, 0.74) 50%, rgba(10, 2, 8, 0.82) 100%), url(${dynamicBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
      }}
    >
      <div className="confirmation-container">
        {/* Success Banner */}
        <div className="confirmation-hero-header">
          <div className="confirmation-check-circle" aria-hidden="true">
            <CheckCircle2 size={36} className="check-icon" />
          </div>
          <div className="payment-success-badge-pill mb-2">✓ PAYMENT SUCCESSFUL</div>
          <h1 className="confirmation-title text-white" id="confirmation-header">
            Booking Confirmed!
          </h1>
          <p className="confirmation-subtitle">
            Your seats have been permanently locked. Present this official digital pass at the venue entrance.
          </p>
        </div>

        {/* The Digital Ticket (Only this element is downloaded and printed) */}
        <div className="boarding-ticket-card" ref={ticketRef} id="printable-digital-ticket">
          {/* Top Metallic Gold Glow Strip */}
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
            <span className="ticket-category-pill">{eventCategory.toUpperCase()}</span>
            <h2 className="ticket-event-name" id="confirmed-event-name">
              {eventName}
            </h2>

            <div className="ticket-event-meta-row">
              <div className="ticket-meta-badge">
                <Calendar size={14} className="meta-icon-gold" />
                <span>{formatDate(eventDate)}</span>
              </div>
              <div className="ticket-meta-badge">
                <Clock size={14} className="meta-icon-gold" />
                <span>{eventTime}</span>
              </div>
              <div className="ticket-meta-badge">
                <MapPin size={14} className="meta-icon-gold" />
                <span>{location}</span>
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
            {/* Left Details Column */}
            <div className="ticket-info-fields">
              {/* Booking Reference with Copy */}
              <div className="ticket-field-block">
                <span className="ticket-field-label">Booking Reference</span>
                <div className="ticket-code-row">
                  <span className="ticket-code-text" id="confirmed-booking-id">
                    {bookingRefCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="btn-copy-id"
                    title="Copy Reference"
                    id="btn-copy-booking-ref"
                  >
                    {copied ? <Check size={14} className="copied-icon" /> : <Copy size={14} />}
                    <span className="copy-label">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Transaction Reference */}
              <div className="ticket-field-block">
                <span className="ticket-field-label">Transaction Reference</span>
                <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                  {phonePeMerchantTxnId || 'PHONEPE_TXN_VERIFIED'}
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

              {/* Attendee Name */}
              <div className="ticket-field-block">
                <span className="ticket-field-label">Ticket Holder</span>
                <span className="ticket-field-val">
                  {attendeeName} {attendeeEmail ? `(${attendeeEmail})` : ''}
                </span>
              </div>

              {/* Category & Payment Method */}
              <div className="ticket-fields-subgrid">
                <div className="ticket-field-block">
                  <span className="ticket-field-label">Category / Tier</span>
                  <span className="ticket-field-val gold-tier">{ticketCategory}</span>
                </div>
                <div className="ticket-field-block">
                  <span className="ticket-field-label">Payment Mode</span>
                  <span className="ticket-field-val">{paymentMethod}</span>
                </div>
              </div>

              {/* Pricing Breakdown: Price, Fee, GST, Total */}
              <div className="summary-math-list py-2 my-1 border-t border-b border-gray-200 text-xs text-gray-600">
                <div className="flex justify-between py-0.5">
                  <span>Ticket Base Price:</span>
                  <span>{formatCurrency(subtotal || (totalAmount - (convenienceFee || 40) - Math.round((convenienceFee || 40) * 0.18)))}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Convenience Fee:</span>
                  <span>{formatCurrency(convenienceFee || 40)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>GST (18%):</span>
                  <span>{formatCurrency(Math.round((convenienceFee || 40) * 0.18))}</span>
                </div>
              </div>

              {/* Total Paid */}
              <div className="ticket-field-block total-paid-block">
                <span className="ticket-field-label">Total Amount Paid (Verified)</span>
                <span className="ticket-price-total" id="confirmed-total-amount">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Right QR Code Column */}
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
              <span className="barcode-caption">TIXORA VERIFIED DIGITAL TICKET</span>
              <span className="barcode-date">Issued {formatDate(bookingDate || createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Ticket Action Toolbar: Download, Print, View My Bookings, Explore More Events */}
        <div className="ticket-actions-toolbar" id="ticket-action-buttons">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="btn-ticket-action btn-ticket-primary"
            id="btn-download-ticket"
          >
            <Download size={16} />
            <span>{downloading ? 'Downloading...' : 'Download Ticket'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn-ticket-action"
            id="btn-print-ticket"
          >
            <Printer size={16} />
            <span>Print Ticket</span>
          </button>

          <Link
            to="/my-bookings"
            className="btn-ticket-action"
            id="btn-view-my-bookings"
          >
            <Ticket size={16} />
            <span>View My Bookings</span>
          </Link>

          <Link
            to="/events"
            className="btn-ticket-action btn-ticket-outline"
            id="btn-browse-more-events"
          >
            <span>Explore More Events</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
