import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Ticket,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from '../utils/validation.js';

const Register = () => {
  // Input fields start strictly EMPTY
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Google Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleError, setGoogleError] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Tixora — Create Account';
  }, []);

  const handleAuthSuccess = (authenticatedUser) => {
    if (authenticatedUser?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/events', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateRequired(name)) {
      setError('Please provide your full name.');
      return;
    }

    if (!validateRequired(email)) {
      setError('Please provide an email address.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!validateRequired(password)) {
      setError('Please provide a password.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name,
      email,
      password,
      confirmPassword,
    });
    setIsSubmitting(false);

    if (result.success) {
      handleAuthSuccess(result.user);
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
  };

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
            Join eventgoers experiencing luxury entertainment, verified identity sessions, and real-time interactive ticket booking.
          </p>
        </div>

        <div className="auth-brand-footer">
          <span>Premium Ticket Booking Platform</span>
        </div>
      </div>

      {/* Right Form Side (White Card) */}
      <div className="auth-form-side">
        <div className="auth-form-header">
          <h1 className="auth-heading">Create Account</h1>
          <p className="auth-subheading">
            Sign up to reserve seats and unlock instant digital tickets
          </p>
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          id="btn-google-register"
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
            Or register with email
          </span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {error && (
          <div className="error-state-card" style={{ padding: '12px 16px', margin: '0 0 16px 0', textAlign: 'left' }} role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: 600 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-stack">
          <div className="form-group-block">
            <label className="form-label-text" htmlFor="reg-name">
              Full Name
            </label>
            <div className="form-input-with-icon">
              <User size={18} className="form-icon-prefix" aria-hidden="true" />
              <input
                id="reg-name"
                type="text"
                className="form-text-input has-icon"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group-block">
            <label className="form-label-text" htmlFor="reg-email">
              Email Address
            </label>
            <div className="form-input-with-icon">
              <Mail size={18} className="form-icon-prefix" aria-hidden="true" />
              <input
                id="reg-email"
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
            <label className="form-label-text" htmlFor="reg-password">
              Password
            </label>
            <div className="form-input-with-icon">
              <Lock size={18} className="form-icon-prefix" aria-hidden="true" />
              <input
                id="reg-password"
                type="password"
                className="form-text-input has-icon"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group-block">
            <label className="form-label-text" htmlFor="reg-confirm">
              Confirm Password
            </label>
            <div className="form-input-with-icon">
              <ShieldCheck size={18} className="form-icon-prefix" aria-hidden="true" />
              <input
                id="reg-confirm"
                type="password"
                className="form-text-input has-icon"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-register"
            className="btn-primary w-full"
            disabled={isSubmitting}
            style={{ height: '46px', marginTop: '12px' }}
          >
            <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--velvet)' }}>
            Sign In Here
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
                  Sign up with Google
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Create account via verified Google Identity
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

export default Register;
