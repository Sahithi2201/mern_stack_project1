import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowRight, Ticket, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { validateEmail, validateRequired } from '../utils/validation.js';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/events';

  useEffect(() => {
    document.title = 'Tixora — Sign In';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateRequired(email) || !validateRequired(password)) {
      setError('Please enter both email and password.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await login({ email, password });
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Invalid email or password.');
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@example.com');
    setPassword('Admin@123');
    setError('');
  };

  const handleFillDemoUser = () => {
    setEmail('user@example.com');
    setPassword('User@123');
    setError('');
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
            Experience luxury entertainment and real-time interactive ticket booking.
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
            Sign in to manage your bookings and access digital tickets
          </p>
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
            <label className="form-label-text" htmlFor="login-email">
              Email Address
            </label>
            <div className="form-input-with-icon">
              <Mail size={18} className="form-icon-prefix" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                className="form-text-input has-icon"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSubmitting}
            style={{ height: '48px', marginTop: '8px' }}
          >
            <span>{isSubmitting ? 'Verifying...' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast-Fill */}
        <div className="demo-credentials-box">
          <div className="demo-title">
            <KeyRound size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Quick-Fill Demo Credentials:
          </div>
          <div className="demo-buttons-row">
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="btn-demo-quick"
            >
              Demo Admin
            </button>
            <button
              type="button"
              onClick={handleFillDemoUser}
              className="btn-demo-quick"
            >
              Demo User
            </button>
          </div>
        </div>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ fontWeight: 700, color: 'var(--velvet)' }}>
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
