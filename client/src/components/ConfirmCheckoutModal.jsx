import React from 'react';
import './ConfirmCheckoutModal.css';

export default function ConfirmCheckoutModal({ open, staff, items, total, loading, success, error, onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <div className="confirm-modal-overlay" onClick={success ? null : onCancel}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                {success ? (
                    <div className="success-container">
                        <div className="success-icon">✓</div>
                        <h3 className="success-title">Purchase Successful!</h3>
                        <p className="success-message">Your purchase has been recorded.</p>
                    </div>
                ) : (
                    <>
                        <h3 className="confirm-title">Confirm Checkout</h3>
                        <div className="confirm-message">
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Staff:</strong> {staff ? `${staff.forename} ${staff.surname}` : ''}
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Items:</strong>
                                <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0 }}>
                                    {items.map(item => (
                                        <li key={item.id}>
                                            {item.quantity} × {item.name} <span style={{ color: '#667eea' }}>£{(item.price * item.quantity).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                <span>Total:</span> <span style={{ color: '#667eea' }}>£{total.toFixed(2)}</span>
                            </div>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <div className="confirm-actions">
                            <button className="confirm-btn confirm-cancel" onClick={onCancel} disabled={loading}>Cancel</button>
                            <button className="confirm-btn confirm-ok" onClick={onConfirm} disabled={loading}>
                                {loading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
