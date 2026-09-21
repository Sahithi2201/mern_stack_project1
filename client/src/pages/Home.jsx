import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  MapPin,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import liveConcertHeroImg from '../assets/live_concert_hero.jpg';
import '../styles/home.css';

/**
 * TIXORA 100VH CINEMATIC LANDING PAGE
 * Modern, cinematic entertainment experience with viewport-fitted layout.
 * 
 * Strict layout hierarchy:
 * NAVBAR (Existing Global Navbar: TIXORA logo, Events, Sign In, Get Started)
 * ↓
 * CINEMATIC HERO (100vh viewport, non-scrollable, no duplicate text blocks, no old footer content)
 */
const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Tixora — Premium Event Ticketing & Reservation';
  }, []);

  // Handle Explore Events click with authentication gating
  const handleExploreEvents = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/events');
    } else {
      // Redirect guest to login with state to return to /events upon login
      navigate('/login', { state: { from: { pathname: '/events' } } });
    }
  };

  // Handle Get Started click
  const handleGetStarted = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/events');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="landing-page-root" id="landing-root">
      {/* Background Cinematic Atmosphere Image & Overlays */}
      <div className="hero-bg-visual-wrapper" aria-hidden="true">
        <img
          src={liveConcertHeroImg}
          alt="Live concert stage with audience silhouettes and dramatic lighting"
          className="hero-bg-stage-img"
        />
        <div className="hero-bg-gradient-overlay" />
        <div className="hero-bg-spotlight-gold" />
        <div className="hero-bg-spotlight-velvet" />
      </div>

      {/* 1. TOP NAVBAR (Existing Global Navbar: TIXORA logo, Events, Sign In, Get Started) */}
      <Navbar />

      {/* 2. MAIN CINEMATIC HERO (Fits within viewport) */}
      <main className="cinematic-hero-main">
        <div className="hero-content-grid">
          {/* Left Column: Eyebrow + Headline + Supporting Text + CTA Buttons */}
          <div className="hero-left-content">
            <div className="hero-eyebrow">
              <span className="eyebrow-line" />
              <span>PREMIUM ENTERTAINMENT TICKETING</span>
            </div>

            <h1 className="hero-headline">
              <span className="headline-line-block">Discover Your</span>
              <span className="headline-line-block gold-accent">Next Experience</span>
            </h1>

            <p className="hero-description">
              Movies • Concerts • Sports • Theatre & More across 20+ major cities.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                onClick={handleExploreEvents}
                className="btn-hero-primary"
                id="hero-explore-events-btn"
              >
                <span>Explore Events</span>
                <ArrowRight size={18} />
              </button>

              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="btn-hero-secondary"
                  id="hero-get-started-btn"
                >
                  <span>Get Started</span>
                </button>
              ) : (
                <Link
                  to="/my-bookings"
                  className="btn-hero-secondary"
                  id="hero-my-bookings-btn"
                >
                  <span>My Bookings</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Layered Cinematic Showcase Cards & VIP Ticket Visual */}
          <div className="hero-right-visual">
            <div className="hero-floating-stage">
              {/* Card 1: Live Concert (Left angled) */}
              <div
                className="floating-showcase-card card-concert"
                onClick={handleExploreEvents}
                role="button"
                tabIndex={0}
                title="Browse Live Concerts"
              >
                <div className="card-media-wrapper">
                  <img
                    src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80"
                    alt="Electric Symphony Live Concert"
                    className="card-photo"
                  />
                  <div className="card-overlay" />
                  <span className="card-badge">Concert</span>
                  <div className="card-details">
                    <h3 className="card-event-name">Electric Symphony</h3>
                    <div className="card-meta">
                      <span><MapPin size={11} /> Mumbai • Delhi</span>
                      <span>•</span>
                      <span><Calendar size={11} /> 15 Oct</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: 70mm IMAX Cinema (Center elevated) */}
              <div
                className="floating-showcase-card card-movie"
                onClick={handleExploreEvents}
                role="button"
                tabIndex={0}
                title="Browse Cinema IMAX Screenings"
              >
                <div className="card-media-wrapper">
                  <img
                    src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80"
                    alt="Interstellar IMAX screening"
                    className="card-photo"
                  />
                  <div className="card-overlay" />
                  <span className="card-badge">IMAX Movie</span>
                  <div className="card-details">
                    <h3 className="card-event-name">Interstellar: 70mm</h3>
                    <div className="card-meta">
                      <span><MapPin size={11} /> Hyderabad • Prasads</span>
                      <span>•</span>
                      <span><Calendar size={11} /> 22 Oct</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Sports Arena (Right angled) */}
              <div
                className="floating-showcase-card card-sports"
                onClick={handleExploreEvents}
                role="button"
                tabIndex={0}
                title="Browse Stadium Matches"
              >
                <div className="card-media-wrapper">
                  <img
                    src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80"
                    alt="Cricket Championship"
                    className="card-photo"
                  />
                  <div className="card-overlay" />
                  <span className="card-badge">Sports</span>
                  <div className="card-details">
                    <h3 className="card-event-name">T20 Super League</h3>
                    <div className="card-meta">
                      <span><MapPin size={11} /> Bengaluru • Chennai</span>
                      <span>•</span>
                      <span><Calendar size={11} /> 28 Oct</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Luxury Velvet & Gold VIP Ticket */}
              <div className="decorative-ticket-cluster" onClick={handleExploreEvents} role="button" tabIndex={0}>
                <div className="luxury-ticket-card">
                  <div className="ticket-top-row">
                    <div className="ticket-logo-mark">
                      <Sparkles size={13} color="#F2CB6B" />
                      <span className="ticket-text-white">TIX</span>
                      <span className="ticket-text-gold">ORA</span>
                    </div>
                    <span className="ticket-pill-vip">VIP ACCESS</span>
                  </div>

                  <div className="ticket-tagline">
                    VIP PASS • EXCLUSIVE ACCESS
                  </div>

                  <div className="ticket-divider-strip">
                    <div className="ticket-notch left" />
                    <div className="ticket-dashed-line" />
                    <div className="ticket-notch right" />
                  </div>

                  <div className="ticket-bottom-row">
                    <div className="ticket-barcode">||| | |||| | || |||</div>
                    <div className="ticket-seat-callout">SEC 101 • ROW A</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
