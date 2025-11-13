import React, { useState } from 'react';
import axios from 'axios';

export default function PurchasesExport() {
    const [message, setMessage] = useState('');

    const handleExport = async () => {
        try {
            const res = await axios.get('/api/purchases/export/csv', { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'purchases.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setMessage('Export started');
        } catch (err) {
            if (err.response?.status === 400) {
                setMessage('No purchases available to export');
            } else {
                setMessage('Error exporting purchases: ' + (err.response?.data?.error ?? err.message));
            }
        }
    };

    return (
        <div className="purchases-export">
            <h3>Export Purchases</h3>
            <p>Download a CSV of recorded purchases for billing.</p>
            <button onClick={handleExport}>Download CSV</button>
            {message && <div className="message">{message}</div>}
        </div>
    );
}
