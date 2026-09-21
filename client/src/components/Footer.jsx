import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';

/**
 * TIXORA Global Minimal Footer
 * Sleek, professional entertainment footer with clean alignment and essential links.
 * Strictly free of old marketing text, project descriptions, or feature lists.
 */
const Footer = () => {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  // Strictly prevent footer from rendering on landing page, auth, booking, checkout, confirmation, or admin routes
  if (
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/booking') ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.includes('/seats')
  ) {
    return null;
  }

  return (
    <footer className="footer-wrapper" role="contentinfo">
      <div className="footer-container">
        <div className="footer-main-row">
          {/* Brand & Tagline */}
          <div className="footer-brand-section">
            <Link to="/" className="footer-brand-logo" aria-label="Tixora Home">
              <div className="footer-brand-icon" aria-hidden="true">
                <Sparkles size={16} />
              </div>
              <span className="footer-brand-name">
                <span className="footer-brand-tix">TIX</span>
                <span className="footer-brand-ora">ORA</span>
              </span>
            </Link>
            <span className="footer-divider-dot" aria-hidden="true">•</span>
            <span className="footer-brand-sub">Official Entertainment Ticketing</span>
          </div>

          {/* Clean Inline Navigation */}
          <nav className="footer-nav-links" aria-label="Footer Navigation">
            <Link to="/events" className="footer-nav-item">
              Browse Events
            </Link>
            <Link to="/my-bookings" className="footer-nav-item">
              My Bookings
            </Link>
            <Link to="/profile" className="footer-nav-item">
              Account
            </Link>
          </nav>
        </div>

        {/* Bottom Legal Row */}
        <div className="footer-bottom-row">
          <p className="footer-copyright">
            TIXORA Live Entertainment
          </p>
          <div className="footer-security-note">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Verified Digital Ticketing</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
