import React, { useEffect } from 'react';
import './FormModal.css';

export default function FormModal({ open, title, onClose, children }) {
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                {title && (
                    <div className="form-modal-header">
                        <h3>{title}</h3>
                        <button className="form-modal-close" onClick={onClose}>×</button>
                    </div>
                )}
                <div className="form-modal-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
