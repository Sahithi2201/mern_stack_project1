import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from '../utils/validation.js';

/**
 * TIXORA Create Account Page
 * Exactly mirrors the centered card design and luxury styling of the Sign In page.
 * Fits within a single viewport (100vh) without vertical scrolling.
 */
const Register = () => {
  // Input fields start strictly EMPTY
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Google Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleError, setGoogleError] = useState('');

  // Submission & feedback state
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Create Account — Tixora';
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
    try {
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
    } catch {
      setIsSubmitting(false);
      setError('Unable to sign in right now. Please try again in a moment.');
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
      setGoogleError('Please enter a valid email address.');
      return;
    }

    setIsGoogleSubmitting(true);
    try {
      const result = await googleLogin({ email: googleEmail });
      setIsGoogleSubmitting(false);

      if (result.success) {
        setShowGoogleModal(false);
        handleAuthSuccess(result.user);
      } else {
        setGoogleError(result.error || 'Google authentication failed.');
      }
    } catch {
      setIsGoogleSubmitting(false);
      setGoogleError('Google authentication failed. Please try again.');
    }
  };

  return (
    <div className="auth-card-centered" role="region" aria-label="Create Account Card">
      {/* Card Header */}
      <div className="auth-card-header">
        <h1 className="auth-heading">Create Account</h1>
        <p className="auth-subheading">
          Sign up to reserve seats & instant tickets
        </p>
      </div>

      {/* Error Alert inside Card */}
      {error && (
        <div
          className="alert-error-banner"
          style={{ marginBottom: '12px', textAlign: 'left' }}
          role="alert"
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Registration Form */}
      <form onSubmit={handleSubmit} className="auth-form-stack compact" noValidate>
        {/* Full Name */}
        <div className="form-group-block">
          <label className="form-label-text" htmlFor="reg-name">
            Full Name
          </label>
          <div className="form-input-with-icon">
            <User size={16} className="form-icon-prefix" aria-hidden="true" />
            <input
              id="reg-name"
              type="text"
              className="form-text-input compact has-icon"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="form-group-block">
          <label className="form-label-text" htmlFor="reg-email">
            Email address
          </label>
          <div className="form-input-with-icon">
            <Mail size={16} className="form-icon-prefix" aria-hidden="true" />
            <input
              id="reg-email"
              type="email"
              className="form-text-input compact has-icon"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group-block">
          <label className="form-label-text" htmlFor="reg-password">
            Password
          </label>
          <div className="form-input-with-icon">
            <Lock size={16} className="form-icon-prefix" aria-hidden="true" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              className="form-text-input compact has-icon has-toggle"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="form-icon-toggle"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="form-group-block">
          <label className="form-label-text" htmlFor="reg-confirm">
            Confirm Password
          </label>
          <div className="form-input-with-icon">
            <Lock size={16} className="form-icon-prefix" aria-hidden="true" />
            <input
              id="reg-confirm"
              type={showPassword ? 'text' : 'password'}
              className="form-text-input compact has-icon"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Create Account Primary Button */}
        <button
          type="submit"
          id="btn-create-account"
          className="btn-auth-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="auth-divider" aria-hidden="true">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">OR</span>
        <div className="auth-divider-line" />
      </div>

      {/* Google Sign-In Secondary Button */}
      <button
        type="button"
        id="btn-google-signup"
        onClick={() => {
          setGoogleError('');
          setGoogleEmail('');
          setShowGoogleModal(true);
        }}
        className="btn-google-auth"
        aria-label="Continue with Google"
        disabled={isSubmitting}
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
        <span>Continue with Google</span>
      </button>

      {/* Sign In Link */}
      <div className="auth-footer-prompt">
        <span>Already have an account? </span>
        <Link to="/login" className="auth-accent-link">
          Sign In
        </Link>
      </div>

      {/* Google Sign-In Identity Modal */}
      {showGoogleModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowGoogleModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="google-signup-title"
        >
          <div
            className="modal-content-card"
            style={{ maxWidth: '420px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #E2E8F0',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
              </div>
              <div>
                <h3 id="google-signup-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--velvet-dark)', margin: 0 }}>
                  Create Account with Google
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Quick authentication via Google
                </p>
              </div>
            </div>

            {googleError && (
              <div className="alert-error-banner" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} aria-hidden="true" />
                <span>{googleError}</span>
              </div>
            )}

            <form onSubmit={handleGoogleSubmit} noValidate>
              <div className="form-group-block" style={{ marginBottom: '20px' }}>
                <label className="form-label-text" htmlFor="google-signup-email">
                  Google Account Email
                </label>
                <div className="form-input-with-icon">
                  <Mail size={18} className="form-icon-prefix" aria-hidden="true" />
                  <input
                    id="google-signup-email"
                    type="email"
                    className="form-text-input has-icon"
                    placeholder="name@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    disabled={isGoogleSubmitting}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowGoogleModal(false)}
                  disabled={isGoogleSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-auth-primary"
                  style={{ width: 'auto', padding: '0 24px', height: '42px', marginTop: 0 }}
                  disabled={isGoogleSubmitting}
                >
                  {isGoogleSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Continue</span>
                  )}
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
