import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorMessage
 * Reusable error state display component with optional retry action
 * Styled according to Tixora Design System
 */
const ErrorMessage = ({
  message = 'An unexpected error occurred.',
  title = 'Something went wrong',
  onRetry = null,
}) => {
  return (
    <div className="error-state-card">
      <div className="error-state-icon">
        <AlertTriangle size={32} />
      </div>
      <h3 className="error-state-title">
        {title}
      </h3>
      <p className="error-state-message">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={onRetry}
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
