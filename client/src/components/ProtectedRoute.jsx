import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from './Loading.jsx';

/**
 * Route protection wrapper
 * @param {boolean} adminOnly - Restricts access strictly to users with role === 'admin'
 * @param {React.ReactNode} children - Wrapped page component
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading indicator while session token is being validated
  if (loading) {
    return <Loading message="Checking authentication session..." />;
  }

  // If user is not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route is restricted to admins and current user is not admin, display 403 Forbidden
  if (adminOnly && !isAdmin) {
    return (
      <div
        style={{
          maxWidth: '560px',
          margin: '4rem auto',
          padding: '2.5rem',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #fee2e2',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.08)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️⛔</div>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#991b1b',
            marginBottom: '0.5rem',
          }}
        >
          Access Denied (403)
        </h2>
        <p
          style={{
            color: '#b91c1c',
            fontSize: '1.1rem',
            marginBottom: '1rem',
            fontWeight: 600,
          }}
        >
          You do not have admin permission.
        </p>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Your account (<strong>{user?.email}</strong>) does not hold administrative privileges.
          Only authenticated administrators can view or manage this section.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
            Go to Home
          </Link>
          <Link to="/events" className="btn-outline" style={{ textDecoration: 'none' }}>
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
