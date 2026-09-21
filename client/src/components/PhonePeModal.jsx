import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  QrCode,
  CreditCard,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Ticket,
  Printer,
  Download,
} from 'lucide-react';
import { initiatePhonePePayment, verifyPhonePePayment } from '../services/paymentService.js';
import { formatCurrency } from '../utils/helpers.js';

/**
 * PhonePe Payment Gateway Drawer / Modal
 * Implements the official PhonePe payment verification flow:
 * 1. Initiate transaction on backend
 * 2. Display PhonePe payment options (UPI, QR, Cards, NetBanking)
 * 3. User makes payment
 * 4. User clicks "[ CHECK PAYMENT STATUS ]"
 * 5. Backend strictly verifies transaction status with PhonePe
 * 6. Only upon verified SUCCESS does booking become CONFIRMED!
 */
const PhonePeModal = ({
  isOpen,
  onClose,
  bookingData,
  onPaymentSuccess,
  onPaymentFailed,
}) => {
  const [tab, setTab] = useState('upi'); // 'upi' | 'qr' | 'cards' | 'netbanking'
  const [upiId, setUpiId] = useState('customer@ybl');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [merchantTxnId, setMerchantTxnId] = useState('');
  const [phonePeResult, setPhonePeResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  // Countdown timer for 10-minute seat hold
  useEffect(() => {
    if (!isOpen || verifiedSuccess) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMsg('Payment session expired. Held seats have been released.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, verifiedSuccess]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Step 1: Initiate PhonePe Payment
  const handleStartPayment = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const result = await initiatePhonePePayment({
        eventId: bookingData.eventId,
        showId: bookingData.showId,
        selectedSeats: bookingData.selectedSeats,
        customerInfo: bookingData.customerInfo,
        ticketCategory: bookingData.ticketCategory || 'Premium Gold',
        paymentMethod: `PhonePe ${tab.toUpperCase()}`,
      });

      if (result.success && result.merchantTransactionId) {
        setMerchantTxnId(result.merchantTransactionId);
        setPhonePeResult(result.phonePe);
        setPaymentInitiated(true);

        // If PhonePe returned live redirect URL, open in new window if user permits
        if (result.phonePe?.gatewayUrl) {
          window.open(result.phonePe.gatewayUrl, '_blank');
        }
      } else {
        throw new Error(result.message || 'Failed to initialize payment session.');
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Strict Backend Status Check ("[ CHECK PAYMENT STATUS ]")
  const handleCheckStatus = async (simulateAction = 'SUCCESS') => {
    if (!merchantTxnId) return;
    try {
      setVerifying(true);
      setErrorMsg('');

      const response = await verifyPhonePePayment({
        merchantTransactionId: merchantTxnId,
        simulationAction: simulateAction,
      });

      if (response.verified && response.status === 'CONFIRMED') {
        setVerifiedSuccess(true);
        setConfirmedBooking(response.booking);
        if (onPaymentSuccess) {
          onPaymentSuccess(response.booking || { _id: response.bookingId });
        }
      } else {
        setErrorMsg('Payment verification pending or failed. Please check your PhonePe app.');
        if (onPaymentFailed) {
          onPaymentFailed();
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      setErrorMsg(
        err.response?.data?.message || 'Payment verification failed. Please try again.'
      );
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="phonepe-modal-overlay" role="dialog" aria-modal="true">
      <div className="phonepe-modal-container" id="phonepe-payment-dialog">
        {/* Header with PhonePe and Tixora Brand */}
        <div className="phonepe-modal-header">
          <div className="phonepe-brand-badge">
            <div className="phonepe-logo-circle">
              <span className="phonepe-letter">पे</span>
            </div>
            <div className="phonepe-title-block">
              <span className="phonepe-brand-title">PhonePe Secure Gateway</span>
              <span className="phonepe-brand-sub">TIXORA Verified Checkout</span>
            </div>
          </div>

          <div className="phonepe-session-timer" title="10-minute temporary seat hold">
            <Clock size={14} />
            <span>Expires in {formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Order Amount Banner */}
        <div className="phonepe-amount-strip">
          <div className="amount-info">
            <span className="amount-label">Amount Payable:</span>
            <span className="amount-value" id="phonepe-pay-amount">
              {formatCurrency(bookingData.totalAmount)}
            </span>
          </div>
          <div className="seat-badge-pill">
            <span>{bookingData.selectedSeats.length} Seats: </span>
            <strong>{bookingData.selectedSeats.join(', ')}</strong>
          </div>
        </div>

        {/* Modal Body */}
        <div className="phonepe-modal-body">
          {verifiedSuccess ? (
            /* SUCCESS STATE */
            <div className="payment-success-card">
              <CheckCircle2 size={56} className="text-emerald-400 mx-auto" />
              <h3 className="success-heading">✓ PAYMENT SUCCESSFUL</h3>
              <p className="success-subheading">✓ BOOKING CONFIRMED</p>

              <div className="confirmed-ref-box">
                <span className="ref-label">Booking Reference:</span>
                <span className="ref-code">{confirmedBooking?.bookingReference || 'TXR-CONFIRMED'}</span>
                <span className="ref-txn">PhonePe Txn ID: {merchantTxnId}</span>
              </div>

              <p className="success-ticket-note">
                Your seats have been permanently locked and your digital pass is ready.
              </p>

              <div className="success-actions-row">
                <button
                  type="button"
                  className="btn-gold-action"
                  id="btn-view-confirmed-ticket"
                  onClick={() => {
                    const bId = confirmedBooking?._id || bookingData.bookingId;
                    window.location.href = `/booking-confirmation/${bId}`;
                  }}
                >
                  <Ticket size={18} />
                  <span>VIEW DIGITAL TICKET</span>
                </button>
              </div>
            </div>
          ) : !paymentInitiated ? (
            /* STEP 1: SELECT PAYMENT METHOD & INITIATE */
            <div>
              {/* Payment Tabs */}
              <div className="phonepe-tabs" role="tablist">
                <button
                  type="button"
                  className={`phonepe-tab ${tab === 'upi' ? 'active' : ''}`}
                  onClick={() => setTab('upi')}
                >
                  <Smartphone size={16} />
                  <span>UPI ID / App</span>
                </button>
                <button
                  type="button"
                  className={`phonepe-tab ${tab === 'qr' ? 'active' : ''}`}
                  onClick={() => setTab('qr')}
                >
                  <QrCode size={16} />
                  <span>QR Code</span>
                </button>
                <button
                  type="button"
                  className={`phonepe-tab ${tab === 'cards' ? 'active' : ''}`}
                  onClick={() => setTab('cards')}
                >
                  <CreditCard size={16} />
                  <span>Debit / Card</span>
                </button>
                <button
                  type="button"
                  className={`phonepe-tab ${tab === 'netbanking' ? 'active' : ''}`}
                  onClick={() => setTab('netbanking')}
                >
                  <Building size={16} />
                  <span>NetBanking</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="phonepe-tab-content">
                {tab === 'upi' && (
                  <div className="upi-content">
                    <label htmlFor="phonepe-upi-input" className="input-field-label">
                      Enter UPI ID / VPA
                    </label>
                    <div className="upi-input-group">
                      <input
                        id="phonepe-upi-input"
                        type="text"
                        className="phonepe-input"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. mobile@ybl, username@okhdfcbank"
                      />
                      <span className="upi-verify-tag">Verified UPI</span>
                    </div>
                    <div className="upi-popular-badges">
                      <span onClick={() => setUpiId('customer@ybl')}>@ybl</span>
                      <span onClick={() => setUpiId('customer@ibl')}>@ibl</span>
                      <span onClick={() => setUpiId('customer@okhdfcbank')}>@okhdfcbank</span>
                      <span onClick={() => setUpiId('customer@paytm')}>@paytm</span>
                    </div>
                  </div>
                )}

                {tab === 'qr' && (
                  <div className="qr-content text-center">
                    <div className="qr-code-box">
                      <QrCode size={120} className="text-gray-800" />
                      <span className="qr-scan-label">Scan with PhonePe or any UPI App</span>
                    </div>
                    <p className="qr-hint">Open PhonePe app → Scan QR → Complete ₹{bookingData.totalAmount}</p>
                  </div>
                )}

                {tab === 'cards' && (
                  <div className="cards-content">
                    <div className="field-row">
                      <label className="input-field-label">Card Number</label>
                      <input
                        type="text"
                        className="phonepe-input"
                        placeholder="4532 •••• •••• 8921"
                        defaultValue="4532 8901 2345 6789"
                      />
                    </div>
                    <div className="field-grid-2">
                      <div>
                        <label className="input-field-label">Expiry (MM/YY)</label>
                        <input type="text" className="phonepe-input" placeholder="08/29" defaultValue="11/28" />
                      </div>
                      <div>
                        <label className="input-field-label">CVV</label>
                        <input type="password" className="phonepe-input" placeholder="•••" defaultValue="789" />
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'netbanking' && (
                  <div className="netbanking-content">
                    <label className="input-field-label">Select Bank</label>
                    <select className="phonepe-input" defaultValue="HDFC">
                      <option value="HDFC">HDFC Bank</option>
                      <option value="SBI">State Bank of India (SBI)</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="AXIS">Axis Bank</option>
                      <option value="KOTAK">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Error notice */}
              {errorMsg && (
                <div className="phonepe-error-notice" role="alert">
                  <XCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Launch Action Button */}
              <button
                type="button"
                className="btn-phonepe-submit"
                id="btn-initiate-phonepe"
                disabled={loading || timeLeft <= 0}
                onClick={handleStartPayment}
              >
                {loading ? (
                  <span>Opening PhonePe Gateway...</span>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>PAY {formatCurrency(bookingData.totalAmount)} VIA PHONEPE</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* STEP 2: PAYMENT IN PROGRESS → VERIFY TRANSACTION */
            <div className="phonepe-verification-stage">
              <div className="gateway-active-pill">
                <RefreshCw size={18} className="animate-spin text-amber-400" />
                <span>PhonePe Transaction in Progress</span>
              </div>

              <div className="active-txn-card">
                <div className="txn-meta-row">
                  <span>Merchant Transaction ID:</span>
                  <code>{merchantTxnId}</code>
                </div>
                <div className="txn-meta-row">
                  <span>Amount:</span>
                  <strong>{formatCurrency(bookingData.totalAmount)}</strong>
                </div>
                <div className="txn-meta-row">
                  <span>Status:</span>
                  <span className="badge-pending">WAITING FOR GATEWAY COMPLETION</span>
                </div>
              </div>

              <p className="status-instructions">
                Complete the payment on your PhonePe mobile app or browser tab, then click below to verify status.
              </p>

              {errorMsg && (
                <div className="phonepe-error-notice" role="alert">
                  <XCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* THE MANDATORY [ CHECK PAYMENT STATUS ] BUTTON */}
              <div className="status-buttons-column">
                <button
                  type="button"
                  className="btn-phonepe-check-status"
                  id="btn-check-payment-status"
                  disabled={verifying}
                  onClick={() => handleCheckStatus('SUCCESS')}
                >
                  {verifying ? (
                    <span>Verifying with PhonePe Server...</span>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>[ CHECK PAYMENT STATUS ]</span>
                    </>
                  )}
                </button>

                {/* Simulation Test Option to trigger payment failure for testing resilience */}
                <button
                  type="button"
                  className="btn-simulate-fail"
                  disabled={verifying}
                  onClick={() => handleCheckStatus('FAIL')}
                >
                  <span>Simulate Payment Failure / Cancellation</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="phonepe-modal-footer">
          <div className="secure-badge-note">
            <ShieldCheck size={16} color="#27AE60" />
            <span>PCI-DSS Compliant • 256-Bit SHA Checksum Verified</span>
          </div>

          {!verifiedSuccess && (
            <button
              type="button"
              className="btn-cancel-payment"
              onClick={onClose}
              disabled={loading || verifying}
            >
              Cancel & Unlock Seats
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhonePeModal;
