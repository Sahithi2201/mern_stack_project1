import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Clock,
  MapPin,
  User,
  Ticket as TicketIcon,
  CheckCircle2,
  XCircle,
  Search,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import TicketBarcode from '../components/TicketBarcode.jsx';
import { formatCurrency, formatDate } from '../utils/helpers.js';
import { getEventCinematicBackground } from '../utils/eventBackgrounds.js';

export const TicketVerification = () => {
  const { ticketId: paramTicketId } = useParams();
  const [ticketInput, setTicketInput] = useState(paramTicketId || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const performVerification = async (codeToVerify) => {
    const code = (codeToVerify || ticketInput).trim();
    if (!code) {
      setError('Please enter a valid Ticket ID or Booking Reference.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const res = await axios.get(`/api/bookings/verify-ticket/${encodeURIComponent(code)}`);
      setResult(res.data);
    } catch (err) {
      console.error('Verification query failed:', err);
      if (err.response?.data) {
        setResult(err.response.data);
      } else {
        setError('Unable to reach the Tixora ticket registry. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramTicketId) {
      performVerification(paramTicketId);
    }
  }, [paramTicketId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    performVerification(ticketInput);
  };

  const bgImage = result?.event ? getEventCinematicBackground(result.event) : '';

  return (
    <div
      className="min-h-screen py-12 px-4 flex flex-col items-center justify-start relative text-gray-100"
      style={{
        backgroundImage: bgImage
          ? `linear-gradient(180deg, rgba(16, 4, 13, 0.88) 0%, rgba(12, 2, 9, 0.94) 100%), url(${bgImage})`
          : 'linear-gradient(180deg, #150512 0%, #0A0208 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="w-full max-w-2xl mx-auto z-10">
        {/* Verification Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider uppercase mb-3">
            <ShieldCheck size={16} className="text-amber-400" />
            Official Gate Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            TIXORA Ticket Verification Portal
          </h1>
          <p className="text-sm text-gray-300 mt-2 max-w-lg mx-auto">
            Scan or enter the unique Ticket ID or Booking Reference to verify admission validity directly against the Tixora database.
          </p>
        </div>

        {/* Search / Scan Input Box */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2 p-1.5 bg-zinc-900/90 backdrop-blur-md border border-amber-500/30 rounded-xl shadow-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Enter Ticket ID (e.g. TIX-2026-XXXXXX) or Booking Ref"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-transparent text-white font-mono text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 transition shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify Pass'}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-2 text-center font-medium">{error}</p>}
        </form>

        {/* Verification Results Card */}
        {result && (
          <div className="bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-lg">
            {/* Status Header Strip */}
            <div
              className={`p-6 text-center border-b flex flex-col items-center justify-center ${
                result.verified && result.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/60 border-red-500/40 text-red-300'
              }`}
            >
              {result.verified && result.verificationStatus === 'VERIFIED' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 size={36} className="text-emerald-400" />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-widest uppercase bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/40">
                    ADMISSION GRANTED
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2 tracking-wide">
                    VERIFIED OFFICIAL PASS
                  </h2>
                  <p className="text-xs text-emerald-200 mt-1">
                    Confirmed database match • Payment status: PAID
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center mb-3">
                    <XCircle size={36} className="text-red-400" />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-widest uppercase bg-red-500/20 px-3 py-1 rounded-full border border-red-400/40">
                    ADMISSION DENIED
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2 tracking-wide">
                    {result.verificationStatus || 'INVALID PASS'}
                  </h2>
                  <p className="text-xs text-red-200 mt-1">
                    {result.message || 'Only successfully paid and confirmed bookings can display VERIFIED.'}
                  </p>
                </>
              )}
            </div>

            {/* Ticket Details Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Event Block */}
              {result.event && (
                <div className="bg-zinc-800/60 p-4 rounded-xl border border-zinc-700/60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                    <span>{result.event.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{result.event.name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-amber-400" />
                      <span>{result.event.date ? formatDate(result.event.date) : 'Show Date TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-amber-400" />
                      <span>{result.event.time || 'Showtime TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin size={15} className="text-amber-400 shrink-0" />
                      <span>{result.event.venue} {result.event.city ? `• ${result.event.city}` : ''}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendee & Seats Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/40">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Ticket Holder
                  </span>
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <User size={15} className="text-amber-400" />
                    <span>{result.user?.name || 'Valued Guest'}</span>
                  </div>
                  {result.user?.email && (
                    <span className="text-xs text-gray-400 block mt-0.5 ml-6">{result.user.email}</span>
                  )}
                </div>

                <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/40">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Reserved Seats ({result.selectedSeats?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {result.selectedSeats && result.selectedSeats.length > 0 ? (
                      result.selectedSeats.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-mono text-xs font-bold rounded border border-amber-500/30"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No seats recorded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Technical / Verification Meta Grid */}
              <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 font-mono text-xs space-y-2 text-gray-300">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-gray-500">Ticket ID:</span>
                  <span className="text-amber-400 font-bold">{result.ticketId || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-gray-500">Booking Reference:</span>
                  <span className="text-white">{result.bookingReference || result.bookingId || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-gray-500">Payment Status:</span>
                  <span
                    className={
                      result.paymentStatus === 'PAID'
                        ? 'text-emerald-400 font-bold'
                        : 'text-red-400 font-bold'
                    }
                  >
                    {result.paymentStatus || 'UNPAID'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-gray-500">Booking Status:</span>
                  <span
                    className={
                      result.bookingStatus === 'CONFIRMED'
                        ? 'text-emerald-400 font-bold'
                        : 'text-yellow-400 font-bold'
                    }
                  >
                    {result.bookingStatus || 'PENDING'}
                  </span>
                </div>
                {result.totalAmount !== undefined && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="text-white font-bold">{formatCurrency(result.totalAmount)}</span>
                  </div>
                )}
              </div>

              {/* Barcode Output */}
              {result.ticketId && (
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <TicketBarcode ticketId={result.ticketId} />
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-zinc-950/90 border-t border-zinc-800/80 flex justify-between items-center text-xs">
              <Link to="/events" className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium">
                Explore More Events <ArrowRight size={13} />
              </Link>
              <Link to="/my-bookings" className="text-gray-400 hover:text-white flex items-center gap-1">
                My Bookings <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketVerification;
