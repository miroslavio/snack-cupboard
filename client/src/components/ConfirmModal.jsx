import React, { useEffect } from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onCancel();
            } else if (e.key === 'Enter') {
                onConfirm();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onConfirm, onCancel]);

    if (!open) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onCancel}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
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
