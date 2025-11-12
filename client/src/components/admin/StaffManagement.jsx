import React, { useState } from 'react';
import axios from 'axios';
import './staff.css';

export default function StaffManagement() {
    const [csvText, setCsvText] = useState('');
    const [message, setMessage] = useState('');

    const handleImport = async () => {
        try {
            const response = await axios.post('/api/staff/import', csvText, {
                headers: { 'Content-Type': 'text/csv' }
            });
            setMessage(response.data.message);
        } catch (err) {
            setMessage('Error importing staff: ' + (err.response?.data?.error ?? err.message));
        }
    };

    return (
        <div className="staff-management">
            <h3>Import Staff List (CSV)</h3>
            <p>Upload a CSV with headers: StaffID, Initials, Surname, Forename</p>
            <textarea
                rows={10}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`StaffID,Initials,Surname,Forename\n001,AB,Smith,Alan`}
            />

            <div className="staff-actions">
                <button onClick={handleImport}>Import CSV</button>
            </div>

            {message && <div className="message">{message}</div>}
        </div>
    );
}
