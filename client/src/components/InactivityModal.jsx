import React from 'react';
import './InactivityModal.css';

export default function InactivityModal({ timeRemaining, onStayActive }) {
    return (
        <div className="inactivity-modal-overlay">
            <div className="inactivity-modal">
                <div className="inactivity-modal-icon">⏱️</div>
                <h2>Are you still there?</h2>
                <p>You will be returned to the home page in <strong>{timeRemaining} seconds</strong> due to inactivity.</p>
                <div className="inactivity-modal-actions">
                    <button onClick={onStayActive} className="stay-active-btn">
                        I'm still here
                    </button>
                </div>
            </div>
        </div>
    );
}
