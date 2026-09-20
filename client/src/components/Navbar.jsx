import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, Menu, X, User, LogOut, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * TIXORA Global Navigation Bar
 * Theme: GOLD + VELVET + WHITE + BREEZE
 * Height: 76px, Background: #21091A, Bottom border: gold with low opacity
 */
const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-wrapper">
      <nav className="navbar-container" aria-label="Main Navigation">
        {/* Brand Logo: Sparkles icon + TIX (white) + ORA (gold) */}
        <Link to="/" className="navbar-brand" onClick={closeMenu} aria-label="Tixora Home">
          <div className="brand-logo-mark" aria-hidden="true">
            <Sparkles className="brand-icon-svg" size={18} />
          </div>
          <span className="brand-name">
            <span className="brand-name-tix">TIX</span>
            <span className="brand-name-ora">ORA</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar-desktop-nav">
          <NavLink
            to="/events"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <Calendar size={16} aria-hidden="true" />
            <span>Events</span>
          </NavLink>

          {/* Authenticated Regular User Links */}
          {isAuthenticated && !isAdmin && (
            <>
              <NavLink
                to="/my-bookings"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <span>My Bookings</span>
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <User size={16} aria-hidden="true" />
                <span>Profile</span>
              </NavLink>
            </>
          )}

          {/* Authenticated Admin Links */}
          {isAuthenticated && isAdmin && (
            <>
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <Shield size={16} aria-hidden="true" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/admin/events"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <span>Manage Events</span>
              </NavLink>
              <NavLink
                to="/admin/bookings"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <span>Manage Bookings</span>
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <span>Manage Users</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Desktop Right Side CTA / Auth */}
        <div className="navbar-auth-actions">
          {!isAuthenticated ? (
            <div className="auth-btn-group">
              <Link to="/login" className="btn-ghost">
                Sign In
              </Link>
              <Link to="/register" className="btn-secondary btn-sm">
                Get Started
              </Link>
            </div>
          ) : (
            <div className="user-action-group">
              <div className="user-pill">
                <div className="user-avatar-circle" aria-hidden="true">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="user-display-name">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                {isAdmin && <span className="admin-chip">Admin</span>}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-logout"
                title="Sign out of Tixora"
                aria-label="Logout"
              >
                <LogOut size={16} aria-hidden="true" />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="navbar-hamburger"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer" role="dialog" aria-modal="true">
          <div className="mobile-menu-links">
            <NavLink
              to="/"
              onClick={closeMenu}
              className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}
            >
              Home
            </NavLink>
            <NavLink
              to="/events"
              onClick={closeMenu}
              className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}
            >
              Discover Events
            </NavLink>

            {isAuthenticated && !isAdmin && (
              <>
                <NavLink
                  to="/my-bookings"
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}
                >
                  My Bookings
                </NavLink>
                <NavLink
                  to="/profile"
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}
                >
                  My Profile
                </NavLink>
              </>
            )}

            {isAuthenticated && isAdmin && (
              <>
                <div className="mobile-menu-divider" />
                <div className="mobile-menu-heading">Admin Management</div>
                <NavLink
                  to="/admin"
                  end
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/admin/events"
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}
                >
                  Manage Events
                </NavLink>
                <NavLink
                  to="/admin/bookings"
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}
                >
                  Manage Bookings
                </NavLink>
                <NavLink
                  to="/admin/users"
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}
                >
                  Manage Users
                </NavLink>
              </>
            )}

            <div className="mobile-menu-divider" />

            {!isAuthenticated ? (
              <div className="mobile-menu-auth">
                <Link to="/login" onClick={closeMenu} className="btn-ghost" style={{ justifyContent: 'center' }}>
                  Sign In
                </Link>
                <Link to="/register" onClick={closeMenu} className="btn-secondary w-full" style={{ justifyContent: 'center' }}>
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="mobile-menu-user-row">
                <div className="user-info-text">
                  <p className="mobile-user-name">{user?.name || 'User'}</p>
                  <p className="mobile-user-email">{user?.email}</p>
                </div>
                <button type="button" onClick={handleLogout} className="btn-danger btn-sm">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
