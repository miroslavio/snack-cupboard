import React from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal">
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button className="confirm-btn confirm-cancel" onClick={onCancel}>Cancel</button>
                    <button className="confirm-btn confirm-ok" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    );
}
