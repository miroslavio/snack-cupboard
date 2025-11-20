import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function PurchasesExport() {
    const [message, setMessage] = useState('');
    const [availableTerms, setAvailableTerms] = useState([]);
    const [selectedTermYear, setSelectedTermYear] = useState('');
    const [filterEnabled, setFilterEnabled] = useState(false);

    useEffect(() => {
        fetchAvailableTerms();
    }, []);

    const fetchAvailableTerms = async () => {
        try {
            const res = await axios.get('/api/settings/terms');
            setAvailableTerms(res.data);
            if (res.data.length > 0) {
                setSelectedTermYear(`${res.data[0].term} ${res.data[0].academic_year}`);
            }
        } catch (err) {
            console.error('Error loading terms:', err);
        }
    };

    const handleExport = async () => {
        try {
            const params = {};
            if (filterEnabled && selectedTermYear) {
                const [term, year] = selectedTermYear.split(' ');
                params.term = term;
                params.academic_year = year;
            }

            const res = await axios.get('/api/purchases/export/csv', {
                params,
                responseType: 'blob'
            });

            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const filename = filterEnabled && selectedTermYear
                ? `purchases_${selectedTermYear.replace(' ', '_')}.csv`
                : 'purchases_all.csv';

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setMessage('Export completed successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            if (err.response?.status === 400) {
                setMessage('No purchases available to export');
            } else {
                setMessage('Error exporting purchases: ' + (err.response?.data?.error ?? err.message));
            }
        }
    };

    return (
        <div className="admin-section">
            <p className="section-description">
                Download a CSV file of purchases for billing and record-keeping.
            </p>

            <div className="form-group">
                <label>
                    <input
                        type="checkbox"
                        checked={filterEnabled}
                        onChange={(e) => setFilterEnabled(e.target.checked)}
                        style={{ marginRight: '8px' }}
                    />
                    Filter by term
                </label>
            </div>

            {filterEnabled && (
                <div className="form-group" style={{ marginTop: '16px' }}>
                    <select
                        id="export-term"
                        value={selectedTermYear}
                        onChange={(e) => setSelectedTermYear(e.target.value)}
                        className="form-input"
                        disabled={availableTerms.length === 0}
                    >
                        {availableTerms.map((t, idx) => (
                            <option key={idx} value={`${t.term} ${t.academic_year}`}>
                                {t.term} {t.academic_year}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="button-group" style={{ marginTop: '16px' }}>
                <button onClick={handleExport} className="btn-primary">
                    {filterEnabled && selectedTermYear
                        ? `Export ${selectedTermYear}`
                        : 'Export All Purchases'}
                </button>
            </div>

            {message && (
                <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
                    {message}
                </div>
            )}

            {availableTerms.length === 0 && (
                <div className="info-box">
                    No purchases recorded yet. Make some purchases to export data.
                </div>
            )}
        </div>
    );
}
