import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import axios from 'axios';
import PasswordModal from '../PasswordModal';
import ConfirmModal from '../ConfirmModal';
import './DangerZone.css';

export default function DangerZone() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmationPhrase, setConfirmationPhrase] = useState('');
    const [countdown, setCountdown] = useState(15);
    const [canConfirm, setCanConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStatistics();
    }, []);

    useEffect(() => {
        if (showConfirmModal && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setCanConfirm(true);
        }
    }, [showConfirmModal, countdown]);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/reset/statistics');
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching statistics:', err);
            setError('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    const handleExportBackup = async () => {
        try {
            const response = await axios.get('/api/reset/export-backup');
            const dataStr = JSON.stringify(response.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const url = window.URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `snack-cupboard-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setMessage('Backup exported successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Export error:', err);
            setError('Failed to export backup');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleInitiateReset = () => {
        setPassword('');
        setShowPasswordModal(true);
    };

    const handlePasswordSubmit = async (enteredPassword) => {
        try {
            const response = await axios.post('/api/reset/verify-password', {
                password: enteredPassword
            });

            if (response.data.valid) {
                setPassword(enteredPassword);
                setShowPasswordModal(false);
                setShowConfirmModal(true);
                setCountdown(15);
                setCanConfirm(false);
                setConfirmationPhrase('');
                return true;
            } else {
                return false;
            }
        } catch (err) {
            console.error('Password verification error:', err);
            return false;
        }
    };

    const handleConfirmReset = async () => {
        if (confirmationPhrase !== 'DELETE') {
            setError('You must type exactly: DELETE');
            return;
        }

        if (!canConfirm) {
            setError('Please wait for the countdown to finish');
            return;
        }

        try {
            setResetting(true);
            await axios.post('/api/reset/execute', {
                password,
                confirmationPhrase
            });

            setShowConfirmModal(false);
            setMessage('Database reset successfully! Refreshing...');

            // Refresh the page after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } catch (err) {
            console.error('Reset error:', err);
            setError(err.response?.data?.error || 'Failed to reset database');
            setResetting(false);
        }
    };

    if (loading) {
        return <div className="danger-zone loading">Loading statistics...</div>;
    }

    return (
        <div className="danger-zone">
            <div className="danger-zone-warning">
                <p><strong>Warning:</strong> Actions in this section are irreversible and will permanently delete data.</p>
            </div>

            {message && <div className="success-message">{message}</div>}

            <div className="danger-zone-section">
                <div className="section-info">
                    <div>
                        <h3>Export Complete Backup</h3>
                        <p>Download all data as a JSON file before performing any destructive operations.</p>
                    </div>
                    <button className="export-btn" onClick={handleExportBackup}>
                        <Download size={18} />
                        Export Backup
                    </button>
                </div>

                <div className="section-info">
                    <div>
                        <h3>Reset All Data</h3>
                        <p>Permanently delete all purchases, staff, items, and terms. This action cannot be undone.</p>
                        {stats && (
                            <div className="reset-stats">
                                <strong>This will delete:</strong>
                                <ul>
                                    <li>{stats.purchases} purchases</li>
                                    <li>{stats.staff} active staff members</li>
                                    <li>{stats.archivedStaff} archived staff members</li>
                                    <li>{stats.items} active items</li>
                                    <li>{stats.archivedItems} archived items</li>
                                    <li>{stats.terms} terms</li>
                                </ul>
                                <p className="total-count">Total: {stats.total} records</p>
                            </div>
                        )}
                    </div>
                    <button className="reset-btn" onClick={handleInitiateReset}>
                        <Trash2 size={18} />
                        Reset All Data
                    </button>
                </div>
            </div>

            <PasswordModal
                open={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSubmit={handlePasswordSubmit}
                title="Confirm Admin Password"
                message="Enter your admin password to continue with the reset process."
            />

            <ConfirmModal
                open={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setError('');
                }}
                onConfirm={handleConfirmReset}
                title="⚠️ Final Confirmation Required"
                confirmText="Reset All Data"
                cancelText="Cancel"
                danger={true}
                hideActions={countdown > 0}
            >
                <div className="reset-confirmation">
                    {error && <div className="modal-error-message">{error}</div>}

                    <div className="countdown-warning">
                        {countdown > 0 ? (
                            <p className="countdown-text">
                                Please wait <strong>{countdown}</strong> seconds before confirming...
                            </p>
                        ) : (
                            <p className="countdown-complete">You may now confirm the reset</p>
                        )}
                    </div>

                    <div className="final-warning">
                        <p><strong>This will:</strong></p>
                        <ul>
                            <li>Delete all {stats?.purchases} purchases</li>
                            <li>Delete all {stats?.staff + stats?.archivedStaff} staff members</li>
                            <li>Delete all {stats?.items + stats?.archivedItems} items</li>
                            <li>Delete all {stats?.terms} terms</li>
                            <li>Create one new default term</li>
                            <li>Preserve your admin password and settings</li>
                        </ul>
                        <p className="warning-emphasis">
                            ⚠️ This action is <strong>PERMANENT</strong> and cannot be undone!
                        </p>
                    </div>

                    {countdown === 0 && (
                        <div className="confirmation-input-section">
                            <p><strong>To confirm, type the word:</strong> <code>DELETE</code></p>
                            <input
                                type="text"
                                value={confirmationPhrase}
                                onChange={(e) => setConfirmationPhrase(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && canConfirm && !resetting) {
                                        handleConfirmReset();
                                    }
                                }}
                                placeholder="Type: DELETE"
                                disabled={countdown > 0 || resetting}
                                className="confirmation-input"
                                autoComplete="off"
                            />
                        </div>
                    )}
                </div>
            </ConfirmModal>
        </div>
    );
}
