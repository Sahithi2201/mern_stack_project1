import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmDialog
 * Accessible modal confirmation dialog for dangerous actions (delete event, reset seats, cancel booking)
 */
const ConfirmDialog = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={loading ? undefined : onCancel}>
      <div
        className="modal-box-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <button
          type="button"
          className="modal-close-icon-btn"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        <div className={`modal-danger-icon-circle ${type === 'danger' ? 'danger-theme' : 'warning-theme'}`}>
          <AlertTriangle size={26} />
        </div>

        <h3 id="confirm-dialog-title" className="modal-title">
          {title}
        </h3>

        <p className="modal-description">{message}</p>

        <div className="modal-actions-grid">
          <button
            type="button"
            className={type === 'danger' ? 'btn-modal-cancel-action' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
          <button
            type="button"
            className="btn-modal-keep-action"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
