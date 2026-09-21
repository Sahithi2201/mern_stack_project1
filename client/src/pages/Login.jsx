import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { validateEmail, validateRequired } from '../utils/validation.js';

/**
 * TIXORA Premium Sign-In Page
 * A luxury, cinematic, modern authentication screen.
 * Centered card architecture, no vertical scrolling, strictly empty fields on load.
 */
const Login = () => {
  // Input fields start strictly EMPTY — no prefilled values or default accounts
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Google Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [showForgotInfo, setShowForgotInfo] = useState(false);

  // Submission & feedback state
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/events';

  useEffect(() => {
    document.title = 'Sign In — Tixora';
  }, []);

  // Centralized redirect strictly based on backend-authenticated role
  const handleAuthSuccess = (authenticatedUser) => {
    if (authenticatedUser?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  // 1. Primary Email + Password Sign-In
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateRequired(email)) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validateRequired(password)) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login({ email, password });
      setIsSubmitting(false);

      if (result.success) {
        handleAuthSuccess(result.user);
      } else {
        setError(result.error || 'Incorrect email or password.');
      }
    } catch {
      setIsSubmitting(false);
      setError('Unable to sign in right now. Please try again.');
    }
  };

  // 2. Google Identity Sign-In
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
        setGoogleError(result.error || 'Google sign-in could not be completed. Please try again.');
      }
    } catch {
      setIsGoogleSubmitting(false);
      setGoogleError('Google sign-in could not be completed. Please try again.');
    }
  };

  return (
    <div className="auth-card-centered" role="region" aria-label="Sign In Card">
      {/* Card Header */}
      <div className="auth-card-header">
        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-subheading">
          Sign in to continue to Tixora
        </p>
      </div>

      {/* Error Alert inside Card */}
      {error && (
        <div
          className="alert-error-banner"
          style={{ marginBottom: '14px', textAlign: 'left' }}
          role="alert"
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Sign-In Form */}
      <form onSubmit={handlePasswordSubmit} className="auth-form-stack" noValidate>
        {/* Email Field */}
        <div className="form-group-block">
          <label className="form-label-text" htmlFor="signin-email">
            Email address
          </label>
          <div className="form-input-with-icon">
            <Mail size={18} className="form-icon-prefix" aria-hidden="true" />
            <input
              id="signin-email"
              type="email"
              className="form-text-input has-icon"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="form-group-block">
          <div className="form-label-row">
            <label className="form-label-text" htmlFor="signin-password">
              Password
            </label>
            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => setShowForgotInfo(true)}
            >
              Forgot password?
            </button>
          </div>
          <div className="form-input-with-icon">
            <Lock size={18} className="form-icon-prefix" aria-hidden="true" />
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              className="form-text-input has-icon has-toggle"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="form-icon-toggle"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Sign In Primary Button */}
        <button
          type="submit"
          id="btn-sign-in"
          className="btn-auth-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
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
        id="btn-google-signin"
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

      {/* Create Account Link */}
      <div className="auth-footer-prompt">
        <span>Don't have an account? </span>
        <Link to="/register" className="auth-accent-link">
          Create Account
        </Link>
      </div>

      {/* Forgot Password Helper Modal */}
      {showForgotInfo && (
        <div
          className="modal-overlay"
          onClick={() => setShowForgotInfo(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-content-card"
            style={{ maxWidth: '400px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--velvet-dark)', marginBottom: '10px' }}>
              Account Assistance
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              For seamless access without remembering passwords, you can sign in directly with Google. For further account help, contact support@tixora.com.
            </p>
            <button
              type="button"
              className="btn-auth-primary"
              style={{ height: '40px' }}
              onClick={() => setShowForgotInfo(false)}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Google Sign-In Identity Modal */}
      {showGoogleModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowGoogleModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="google-modal-title"
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
                <h3 id="google-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--velvet-dark)', margin: 0 }}>
                  Sign in with Google
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Authenticate via verified Google Identity
                </p>
              </div>
            </div>

            {googleError && (
              <div
                className="alert-error-banner"
                style={{ marginBottom: '14px', padding: '10px 14px' }}
                role="alert"
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
                <span>{googleError}</span>
              </div>
            )}

            <form onSubmit={handleGoogleSubmit}>
              <div className="form-group-block" style={{ marginBottom: '18px' }}>
                <label className="form-label-text" htmlFor="google-email-input">
                  Google Account Email
                </label>
                <input
                  id="google-email-input"
                  type="email"
                  className="form-text-input"
                  placeholder="your.email@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  disabled={isGoogleSubmitting}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="btn-ghost"
                  disabled={isGoogleSubmitting}
                  style={{ padding: '8px 16px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGoogleSubmitting}
                  className="btn-primary"
                  style={{ padding: '8px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
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

export default Login;
