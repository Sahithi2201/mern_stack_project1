import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket } from 'lucide-react';

/**
 * TIXORA Global Footer
 * Clean, modern footer for event catalog and customer screens.
 */
const Footer = () => {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  // Strictly prevent footer from rendering on authentication or admin routes
  if (
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/admin')
  ) {
    return null;
  }

  return (
    <footer className="footer-wrapper">
      <div className="footer-container">
        <div className="footer-top">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand-logo" aria-label="Tixora">
              <div className="footer-brand-icon">
                <Ticket size={18} />
              </div>
              <span className="footer-brand-name">TIXORA</span>
            </Link>
            <p className="footer-tagline">Your Events. Your Seats. Your Moments.</p>
            <p className="footer-desc">
              A modern MERN-stack ticketing and seat reservation platform crafted for
              seamless event discovery, interactive seating charts, and instant confirmations.
            </p>
          </div>

          {/* Nav Col 1 */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-list">
              <li>
                <Link to="/events" className="footer-link">
                  Discover Events
                </Link>
              </li>
              <li>
                <Link to="/login" className="footer-link">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="footer-link">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="footer-link">
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Col 2 */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Categories</h4>
            <ul className="footer-list">
              <li>
                <Link to="/events?category=Concert" className="footer-link">
                  Live Concerts
                </Link>
              </li>
              <li>
                <Link to="/events?category=Conference" className="footer-link">
                  Conferences
                </Link>
              </li>
              <li>
                <Link to="/events?category=Theatre" className="footer-link">
                  Theatre & Shows
                </Link>
              </li>
              <li>
                <Link to="/events?category=Sports" className="footer-link">
                  Sports & Arena
                </Link>
              </li>
            </ul>
          </div>

          {/* Features Col */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Features</h4>
            <ul className="footer-list">
              <li className="footer-feature-item">✓ Interactive Seat Maps</li>
              <li className="footer-feature-item">✓ Real-Time Availability</li>
              <li className="footer-feature-item">✓ Instant Digital Tickets</li>
              <li className="footer-feature-item">✓ Administrative Analytics</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {currentYear} Tixora. All rights reserved.
          </p>
          <div className="footer-meta-badges">
            <span className="footer-badge">MERN Ticket System</span>
            <span className="footer-badge">Secure Booking</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
