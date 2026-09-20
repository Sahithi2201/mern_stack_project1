import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, Calendar, Ticket, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../utils/helpers.js';

const Profile = () => {
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    document.title = 'Tixora — User Profile';
  }, []);

  return (
    <div className="profile-page-wrapper">
      <div className="page-header-block">
        <div className="page-header-text">
          <h1 className="page-main-title">Account Profile</h1>
          <p className="page-main-subtitle">Manage your credentials and personal ticket history</p>
        </div>
      </div>

      <div className="profile-card-container">
        {/* Main Header / Avatar */}
        <div className="profile-hero-section">
          <div className="profile-large-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-hero-details">
            <div className="profile-name-row">
              <h2 className="profile-display-name">{user?.name || 'Registered Member'}</h2>
              <span className={`profile-role-pill ${isAdmin ? 'role-admin' : 'role-user'}`}>
                <Shield size={13} />
                <span>{isAdmin ? 'System Administrator' : 'Verified Member'}</span>
              </span>
            </div>
            <p className="profile-email-text">{user?.email}</p>
          </div>
        </div>

        {/* Profile Info Details Grid */}
        <div className="profile-details-grid">
          <div className="profile-info-box">
            <div className="info-box-icon">
              <Mail size={16} />
            </div>
            <div>
              <span className="info-box-label">Email Address</span>
              <p className="info-box-value">{user?.email || 'N/A'}</p>
            </div>
          </div>

          <div className="profile-info-box">
            <div className="info-box-icon">
              <Calendar size={16} />
            </div>
            <div>
              <span className="info-box-label">Member Since</span>
              <p className="info-box-value">
                {user?.createdAt ? formatDate(user.createdAt) : 'Recently Joined'}
              </p>
            </div>
          </div>

          <div className="profile-info-box">
            <div className="info-box-icon">
              <Shield size={16} />
            </div>
            <div>
              <span className="info-box-label">Account Tier</span>
              <p className="info-box-value">
                {isAdmin ? 'Full Admin Access' : 'Standard Ticketing'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="profile-actions-panel">
          <h3 className="profile-panel-heading">Quick Shortcuts</h3>
          <div className="profile-action-links">
            <Link to="/my-bookings" className="profile-shortcut-card">
              <div className="shortcut-icon-circle">
                <Ticket size={20} />
              </div>
              <div className="shortcut-text-wrap">
                <strong>My Reservations</strong>
                <p>View confirmed tickets, seat allocations, or cancel bookings</p>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </Link>

            {isAdmin && (
              <Link to="/admin" className="profile-shortcut-card highlight-admin">
                <div className="shortcut-icon-circle admin-icon">
                  <LayoutDashboard size={20} />
                </div>
                <div className="shortcut-text-wrap">
                  <strong>Admin Operations Portal</strong>
                  <p>Manage live events, view cross-platform bookings and audit users</p>
                </div>
                <ArrowRight size={16} className="shortcut-arrow" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
