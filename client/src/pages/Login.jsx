import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  Ticket,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { validateEmail, validateRequired } from '../utils/validation.js';

const Login = () => {
  // Input fields start strictly EMPTY
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');

  // Mode: 'otp' (email OTP verification) or 'password'
  const [authMode, setAuthMode] = useState('otp');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtpHint, setGeneratedOtpHint] = useState('');

  // Google Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleError, setGoogleError] = useState('');

  // Status & feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, requestOtp, verifyOtp, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/events';

  useEffect(() => {
    document.title = 'Tixora — Sign In';
  }, []);

  // Centralized redirect strictly based on backend-authenticated role
  const handleAuthSuccess = (authenticatedUser) => {
    if (authenticatedUser?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  // 1. Handle sending OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validateRequired(email)) {
      setError('Please provide an email address.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await requestOtp(email);
    setIsSubmitting(false);

    if (result.success) {
      setOtpSent(true);
      setSuccessMsg(`Verification code sent to ${email.trim().toLowerCase()}`);
      if (result.data?.otp) {
        setGeneratedOtpHint(result.data.otp);
      }
    } else {
      setError(result.error || 'Failed to send verification code.');
    }
  };

  // 2. Handle verifying OTP and logging in
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateRequired(email)) {
      setError('Please provide an email address.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!validateRequired(otp)) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyOtp(email, otp);
    setIsSubmitting(false);

    if (result.success) {
      handleAuthSuccess(result.user);
    } else {
      setError(result.error || 'Invalid or expired verification code.');
    }
  };

  // 3. Handle password login
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateRequired(email)) {
      setError('Please provide an email address.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!validateRequired(password)) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login({ email, password });
    setIsSubmitting(false);

    if (result.success) {
      handleAuthSuccess(result.user);
    } else {
      setError(result.error || 'Invalid email or password.');
    }
  };

  // 4. Handle Google Sign-In
  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setGoogleError('');

    if (!validateRequired(googleEmail)) {
      setGoogleError('Please enter your Google Account email address.');
      return;
    }

    if (!validateEmail(googleEmail)) {
      setGoogleError('Please enter a valid Google Account email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await googleLogin({ email: googleEmail });
    setIsSubmitting(false);

    if (result.success) {
      setShowGoogleModal(false);
      handleAuthSuccess(result.user);
    } else {
      setGoogleError(result.error || 'Google authentication failed.');
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Brand Showcase Side (Velvet & Gold) */}
      <div className="auth-brand-side">
        <div className="auth-brand-logo">
          <div className="brand-logo-mark" style={{ background: 'var(--gold)', color: 'var(--velvet)' }}>
            <Ticket size={24} />
          </div>
          <span className="brand-name" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            <span style={{ color: '#FFFFFF' }}>TIX</span>
            <span style={{ color: 'var(--gold)' }}>ORA</span>
          </span>
        </div>

        <div className="auth-hero-text">
          <h2 className="auth-hero-tagline">
            Your Events.<br />Your Seats.<br />Your Moments.
          </h2>
          <p className="auth-hero-sub">
            Experience luxury entertainment, verified identity sessions, and real-time interactive ticket booking.
          </p>
        </div>

        <div className="auth-brand-footer">
          <span>Premium Ticket Booking Platform</span>
        </div>
      </div>

      {/* Right Form Side (White Card) */}
      <div className="auth-form-side">
        <div className="auth-form-header">
          <h1 className="auth-heading">Welcome Back</h1>
          <p className="auth-subheading">
            Sign in to access your digital tickets and manage bookings
          </p>
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          id="btn-google-signin"
          onClick={() => {
            setGoogleError('');
            setGoogleEmail('');
            setShowGoogleModal(true);
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-semibold transition-all shadow-xs cursor-pointer"
          style={{
            height: '46px',
            marginBottom: '16px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span style={{ fontSize: '0.95rem', color: '#1e293b' }}>Continue with Google</span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 18px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Or continue with email
          </span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Auth Mode Toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setError('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: authMode === 'otp' ? '#ffffff' : 'transparent',
              color: authMode === 'otp' ? 'var(--velvet)' : '#64748b',
              boxShadow: authMode === 'otp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Email OTP Verification
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setError('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: authMode === 'password' ? '#ffffff' : 'transparent',
              color: authMode === 'password' ? 'var(--velvet)' : '#64748b',
              boxShadow: authMode === 'password' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Password Sign In
          </button>
        </div>

        {error && (
          <div className="error-state-card" style={{ padding: '12px 16px', margin: '0 0 16px 0', textAlign: 'left' }} role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: 600 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '10px 14px', margin: '0 0 14px 0', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.85rem' }} role="status">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
            {generatedOtpHint && (
              <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#15803d' }}>
                Your code is: <strong style={{ letterSpacing: '2px', fontSize: '0.95rem' }}>{generatedOtpHint}</strong>
              </div>
            )}
          </div>
        )}

        {/* 1. OTP Verification Mode */}
        {authMode === 'otp' && (
          <div className="auth-form-stack">
            <div className="form-group-block">
              <label className="form-label-text" htmlFor="login-email">
                Email Address
              </label>
              <div className="form-input-with-icon">
                <Mail size={18} className="form-icon-prefix" aria-hidden="true" />
                <input
                  id="login-email"
                  type="text"
                  className="form-text-input has-icon"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent && isSubmitting}
                  autoComplete="email"
                />
              </div>
            </div>

            {otpSent && (
              <div className="form-group-block" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label-text" htmlFor="login-otp">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Resend Code
                  </button>
                </div>
                <div className="form-input-with-icon">
                  <KeyRound size={18} className="form-icon-prefix" aria-hidden="true" />
                  <input
                    id="login-otp"
                    type="text"
                    maxLength={6}
                    className="form-text-input has-icon"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    autoComplete="one-time-code"
                  />
                </div>
              </div>
            )}

            {!otpSent ? (
              <button
                type="button"
                id="btn-send-otp"
                onClick={handleSendOtp}
                className="btn-primary w-full"
                disabled={isSubmitting}
                style={{ height: '46px', marginTop: '12px' }}
              >
                <span>{isSubmitting ? 'Sending verification code...' : 'Send Verification Code'}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                id="btn-verify-otp"
                onClick={handleVerifyOtp}
                className="btn-primary w-full"
                disabled={isSubmitting}
                style={{ height: '46px', marginTop: '12px' }}
              >
                <span>{isSubmitting ? 'Verifying...' : 'Verify Code & Sign In'}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {/* 2. Password Mode */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="auth-form-stack">
            <div className="form-group-block">
              <label className="form-label-text" htmlFor="login-password-email">
                Email Address
              </label>
              <div className="form-input-with-icon">
                <Mail size={18} className="form-icon-prefix" aria-hidden="true" />
                <input
                  id="login-password-email"
                  type="text"
                  className="form-text-input has-icon"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group-block">
              <label className="form-label-text" htmlFor="login-password">
                Password
              </label>
              <div className="form-input-with-icon">
                <Lock size={18} className="form-icon-prefix" aria-hidden="true" />
                <input
                  id="login-password"
                  type="password"
                  className="form-text-input has-icon"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-password-login"
              className="btn-primary w-full"
              disabled={isSubmitting}
              style={{ height: '46px', marginTop: '12px' }}
            >
              <span>{isSubmitting ? 'Verifying...' : 'Sign In with Password'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ fontWeight: 700, color: 'var(--velvet)' }}>
            Create an Account
          </Link>
        </p>
      </div>

      {/* Google Sign-In Modal */}
      {showGoogleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowGoogleModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Sign in with Google
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Authenticate via verified Google Identity
                </p>
              </div>
            </div>

            {googleError && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem', marginBottom: '14px' }}>
                {googleError}
              </div>
            )}

            <form onSubmit={handleGoogleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Google Account Email
                </label>
                <input
                  type="text"
                  placeholder="your.google.account@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--velvet)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'Authenticating...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
