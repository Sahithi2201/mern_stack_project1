import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Sparkles, ArrowRight, ShieldCheck, Ticket, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { validateEmail, validatePassword, validateRequired } from '../utils/validation.js';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Tixora — Create Account';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateRequired(name) || !validateRequired(email) || !validateRequired(password)) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
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
      navigate('/events', { replace: true });
    } else {
      setError(result.error || 'Registration failed. Please try again.');
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
            Join thousands of eventgoers experiencing premium seats and seamless reservations.
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
            Sign up in seconds to reserve seats and unlock instant digital tickets
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
            <label className="form-label-text" htmlFor="reg-name">
              Full Name
            </label>
            <div className="form-input-with-icon">
              <User size={18} className="form-icon-prefix" aria-hidden="true" />
              <input
                id="reg-name"
                type="text"
                className="form-text-input has-icon"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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
                required
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
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSubmitting}
            style={{ height: '48px', marginTop: '8px' }}
          >
            <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--velvet)' }}>
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
