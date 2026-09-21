import React, { useState } from 'react';
import { Menu, X, Shield, ChevronRight } from 'lucide-react';
import AdminSidebar from './AdminSidebar.jsx';

/**
 * TIXORA Modern Admin Layout Shell
 * Responsive SaaS layout with collapsible mobile drawer, topbar, and scrollable content area.
 */
const AdminLayout = ({ children, title, subtitle, actions }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="admin-shell">
      {/* Sidebar Navigation */}
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Admin Content Container */}
      <div className="admin-shell-main">
        {/* Top Header Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="admin-header-brand-mark">
              <span className="admin-portal-pill">{title || 'Portal'}</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-status-indicator">
              <span className="status-dot-live" />
              <span className="status-label">System Active</span>
            </div>
          </div>
        </header>

        {/* Page Heading & Actions Strip */}
        {(title || actions) && (
          <div className="admin-content-heading-bar">
            <div className="admin-title-wrap">
              <h1 className="admin-page-title">{title}</h1>
              {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="admin-actions-wrap">{actions}</div>}
          </div>
        )}

        {/* Dynamic Admin Body */}
        <div className="admin-content-body">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
