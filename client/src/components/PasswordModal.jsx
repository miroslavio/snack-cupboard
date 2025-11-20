import React, { useState, useEffect } from 'react';
import './PasswordModal.css';

export default function PasswordModal({ open, onSubmit, onCancel, onClose, title, message }) {
    // Support both onCancel and onClose for backwards compatibility
    const handleCancel = onCancel || onClose;

    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) {
            setPassword('');
            setError('');
            return;
        }

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCancel?.();
            } else if (e.key === 'Enter' && password.trim()) {
                handleSubmit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, password, handleCancel]);

    const handleSubmit = async () => {
        if (!password.trim()) {
            setError('Please enter a password');
            return;
        }
        const success = await onSubmit(password);
        if (success === false) {
            setError('Incorrect password');
        }
    };

    if (!open) return null;

    return (
        <div className="password-modal-overlay" onClick={handleCancel}>
            <div className="password-modal" onClick={(e) => e.stopPropagation()}>
                <div className="password-modal-header">
                    <h3>{title || 'Admin Access'}</h3>
                    <button className="password-modal-close" onClick={handleCancel}>×</button>
                </div>
                <div className="password-modal-content">
                    <p>{message || 'Enter password to access admin panel'}</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="Password"
                        autoFocus
                        className={error ? 'error' : ''}
                    />
                    {error && <div className="password-error">{error}</div>}
                </div>
                <div className="password-modal-actions">
                    <button type="button" onClick={handleCancel}>Cancel</button>
                    <button type="submit" className="primary" onClick={handleSubmit}>
                        Unlock
                    </button>
                </div>
            </div>
        </div>
    );
}
