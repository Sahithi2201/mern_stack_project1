import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Search,
  RefreshCw,
  UserCheck,
  Calendar,
  Mail,
  ShieldAlert
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout.jsx';
import AdminTable from '../components/AdminTable.jsx';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import userService from '../services/userService.js';
import { formatDate } from '../utils/helpers.js';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    document.title = 'Tixora Admin — Manage Users';
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userService.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load registered users:', err);
      setError(
        err.response?.data?.message || 'Failed to fetch registered users list.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u._id?.toLowerCase().includes(query);
    const matchesRole =
      roleFilter === 'ALL' || u.role?.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const standardCount = users.filter((u) => u.role !== 'admin').length;

  const headers = [
    { label: 'User Member' },
    { label: 'Email Address' },
    { label: 'Account Role' },
    { label: 'User ID' },
    { label: 'Registered Date' },
  ];

  return (
    <AdminLayout
      title="Manage Users"
      subtitle="View and audit registered customer and administrative system accounts"
      actions={
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={fetchUsers}
          disabled={loading}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      }
    >
      {error && <ErrorMessage message={error} onRetry={fetchUsers} />}

      {/* User Stats Grid */}
      <div className="admin-stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Registered</span>
            <div className="stat-card-icon-circle color-indigo">
              <Users size={18} />
            </div>
          </div>
          <div className="stat-card-value">{users.length}</div>
          <span className="stat-card-subtitle">Active platform accounts</span>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Verified Members</span>
            <div className="stat-card-icon-circle color-emerald">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="stat-card-value">{standardCount}</div>
          <span className="stat-card-subtitle">Standard ticketing users</span>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Administrators</span>
            <div className="stat-card-icon-circle color-blue">
              <Shield size={18} />
            </div>
          </div>
          <div className="stat-card-value">{adminCount}</div>
          <span className="stat-card-subtitle">Elevated management access</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name, email, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-filter-select-wrap">
          <select
            className="admin-filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Standard Users</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      {loading ? (
        <Loading message="Loading user directory..." />
      ) : (
        <div className="admin-panel-card">
          <AdminTable
            headers={headers}
            isEmpty={filteredUsers.length === 0}
            emptyTitle="No users found"
            emptyMessage={
              searchQuery || roleFilter !== 'ALL'
                ? 'No user accounts match your search and filter criteria.'
                : 'No users have registered on the platform yet.'
            }
          >
            {filteredUsers.map((u) => {
              const isAdmin = u.role === 'admin';
              const initial = u.name ? u.name.charAt(0).toUpperCase() : 'U';

              return (
                <tr key={u._id}>
                  <td>
                    <div className="table-user-cell">
                      <div className={`table-user-avatar ${isAdmin ? 'avatar-admin' : ''}`}>
                        {initial}
                      </div>
                      <div>
                        <span className="table-primary-text">{u.name || 'Member'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="table-email-wrap">
                      <Mail size={13} className="table-email-icon" />
                      <span className="table-sub-text" style={{ color: 'var(--text-primary)' }}>
                        {u.email}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`table-role-pill ${isAdmin ? 'role-admin' : 'role-user'}`}>
                      <Shield size={12} />
                      <span>{isAdmin ? 'Administrator' : 'Standard User'}</span>
                    </span>
                  </td>
                  <td>
                    <span className="table-ref-code">#{u._id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td>
                    <span className="table-date-text">
                      {u.createdAt ? formatDate(u.createdAt) : 'Registered'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </AdminTable>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageUsers;
