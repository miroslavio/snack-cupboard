import React, { useEffect } from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({ open, title, message, children, onConfirm, onCancel, onClose, confirmText = 'Delete', hideActions = false }) {
    // Support both onCancel and onClose for backwards compatibility
    const handleCancel = onCancel || onClose;

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCancel?.();
            } else if (e.key === 'Enter' && !children) {
                // Only auto-confirm with Enter if there's no custom content (no input fields)
                onConfirm();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onConfirm, handleCancel, children]);

    if (!open) return null;

    return (
        <div className="confirm-modal-overlay" onClick={handleCancel}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <h3 className="confirm-title">{title}</h3>
                {children ? children : <p className="confirm-message">{message}</p>}
                {!hideActions && (
                    <div className="confirm-actions">
                        <button className="confirm-btn confirm-cancel" onClick={handleCancel}>Cancel</button>
                        <button className="confirm-btn confirm-ok" onClick={onConfirm}>{confirmText}</button>
                    </div>
                )}
            </div>
        </div>
    );
}
