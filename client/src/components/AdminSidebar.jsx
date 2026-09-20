import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  LayoutDashboard,
  Calendar,
  Receipt,
  Users,
  Globe,
  LogOut,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * TIXORA Admin Sidebar Navigation
 * Refined SaaS sidebar with clear hierarchy, active states, and user badge.
 */
const AdminSidebar = ({ mobileOpen = false, onCloseMobile = () => {} }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    onCloseMobile();
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label="Admin Navigation"
      >
        {/* Sidebar Brand Header */}
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-sidebar-brand" onClick={onCloseMobile}>
            <div className="admin-brand-icon">
              <Ticket size={20} />
            </div>
            <div className="admin-brand-text">
              <span className="admin-brand-title">
                <span style={{ color: '#FFFFFF' }}>TIX</span>
                <span style={{ color: 'var(--gold)' }}>ORA</span>
              </span>
              <span className="admin-brand-badge">ADMIN</span>
            </div>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-title">Core Management</div>

          <NavLink
            to="/admin"
            end
            onClick={onCloseMobile}
            className={({ isActive }) =>
              isActive ? 'admin-nav-item active' : 'admin-nav-item'
            }
          >
            <LayoutDashboard size={18} className="admin-nav-icon" />
            <span>Dashboard</span>
            <ChevronRight size={14} className="admin-nav-chevron" />
          </NavLink>

          <NavLink
            to="/admin/events"
            onClick={onCloseMobile}
            className={({ isActive }) =>
              isActive ? 'admin-nav-item active' : 'admin-nav-item'
            }
          >
            <Calendar size={18} className="admin-nav-icon" />
            <span>Manage Events</span>
            <ChevronRight size={14} className="admin-nav-chevron" />
          </NavLink>

          <NavLink
            to="/admin/bookings"
            onClick={onCloseMobile}
            className={({ isActive }) =>
              isActive ? 'admin-nav-item active' : 'admin-nav-item'
            }
          >
            <Receipt size={18} className="admin-nav-icon" />
            <span>Manage Bookings</span>
            <ChevronRight size={14} className="admin-nav-chevron" />
          </NavLink>

          <NavLink
            to="/admin/users"
            onClick={onCloseMobile}
            className={({ isActive }) =>
              isActive ? 'admin-nav-item active' : 'admin-nav-item'
            }
          >
            <Users size={18} className="admin-nav-icon" />
            <span>Manage Users</span>
            <ChevronRight size={14} className="admin-nav-chevron" />
          </NavLink>

          <div className="admin-nav-section-title" style={{ marginTop: '1.25rem' }}>
            Navigation
          </div>

          <Link
            to="/"
            onClick={onCloseMobile}
            className="admin-nav-item admin-nav-link-secondary"
            title="Return to public customer website"
          >
            <Globe size={18} className="admin-nav-icon" />
            <span>Public Website</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="admin-nav-item admin-nav-logout"
            title="Sign out of administrative session"
          >
            <LogOut size={18} className="admin-nav-icon" />
            <span>Sign Out</span>
          </button>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="admin-user-details">
              <span className="admin-user-name">{user?.name || 'Administrator'}</span>
              <span className="admin-user-email">{user?.email || 'admin@example.com'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
