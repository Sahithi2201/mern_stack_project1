import React from 'react';

/**
 * AdminStatCard
 * Clean metric card with title, numeric value, subtitle, icon, and colored theme
 */
const AdminStatCard = ({ title, value, subtitle, icon, color = 'primary' }) => {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-info">
        <span className="admin-stat-title">{title}</span>
        <span className="admin-stat-value">{value}</span>
        {subtitle && <span className="admin-stat-subtitle">{subtitle}</span>}
      </div>
      {icon && <div className={`admin-stat-icon ${color}`}>{icon}</div>}
    </div>
  );
};

export default AdminStatCard;
