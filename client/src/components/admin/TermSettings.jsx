import { useState, useEffect } from 'react';
import ConfirmModal from '../ConfirmModal';
import FormModal from '../FormModal';
import { Info } from 'lucide-react';
import './TermSettings.css';

const TERMS = ['Michaelmas', 'Hilary', 'Trinity'];

// Generate academic years (current year -2 to +2)
const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -2; i <= 2; i++) {
        const startYear = currentYear + i;
        const endYear = startYear + 1;
        years.push(`${startYear}-${endYear.toString().slice(-2)}`);
    }
    return years;
};

const ACADEMIC_YEARS = generateAcademicYears();

function TermSettings({ onTermChange }) {
    const [currentTerm, setCurrentTerm] = useState('Michaelmas');
    const [currentYear, setCurrentYear] = useState('2024-25');
    const [loading, setLoading] = useState(true);
    const [allTerms, setAllTerms] = useState([]);
    const [newTerm, setNewTerm] = useState('Michaelmas');
    const [newYear, setNewYear] = useState(ACADEMIC_YEARS[2]); // Default to current year
    const [addingTerm, setAddingTerm] = useState(false);
    const [message, setMessage] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');
    const [error, setError] = useState('');
    const [deleteError, setDeleteError] = useState('');

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);
    const [deleteCountdown, setDeleteCountdown] = useState(5);
    const [canConfirmDelete, setCanConfirmDelete] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchCurrentSettings();
        fetchAllTerms();
    }, []);

    useEffect(() => {
        let timer;
        if (showDeleteWarning && deleteCountdown > 0) {
            timer = setTimeout(() => setDeleteCountdown(deleteCountdown - 1), 1000);
        } else if (showDeleteWarning && deleteCountdown === 0) {
            setCanConfirmDelete(true);
        }
        return () => clearTimeout(timer);
    }, [showDeleteWarning, deleteCountdown]);

    const fetchCurrentSettings = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/settings/current');
            if (!response.ok) throw new Error('Failed to fetch settings');
            const data = await response.json();
            setCurrentTerm(data.term);
            setCurrentYear(data.academic_year);
        } catch (err) {
            setError('Failed to load current settings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllTerms = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/settings/all-terms');
            if (!response.ok) throw new Error('Failed to fetch terms');
            const data = await response.json();
            console.log('Fetched terms:', data);
            setAllTerms(data);
        } catch (err) {
            console.error('Error loading terms:', err);
        }
    };

    const handleSetActive = async (term, year) => {
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:3001/api/settings/current', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    term: term,
                    academic_year: year
                })
            });

            if (!response.ok) throw new Error('Failed to update settings');

            setCurrentTerm(term);
            setCurrentYear(year);
            setMessage(`${term} ${year} is now the active term for new purchases`);
            setTimeout(() => setMessage(''), 3000);

            // Notify parent to update header
            if (onTermChange) {
                onTermChange();
            }
        } catch (err) {
            setError('Failed to set active term');
            console.error(err);
        }
    };

    const handleAddTerm = async () => {
        if (!newYear.trim()) {
            setError('Please select an academic year');
            return;
        }

        // Check for duplicates
        const duplicate = allTerms.find(t => t.term === newTerm && t.academic_year === newYear);
        if (duplicate) {
            setError(`${newTerm} ${newYear} already exists`);
            setTimeout(() => setError(''), 3000);
            return;
        }

        setAddingTerm(true);
        setError('');
        setMessage('');

        try {
            // Just add the term to the terms table without setting it as active
            const response = await fetch('http://localhost:3001/api/settings/current', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    term: newTerm,
                    academic_year: newYear
                })
            });

            if (!response.ok) throw new Error('Failed to add term');

            setMessage(`${newTerm} ${newYear} has been added. Click "Set Active" to use it for new purchases.`);
            setTimeout(() => setMessage(''), 4000);

            // Close modal and refresh the terms list
            setShowAddModal(false);
            await fetchAllTerms();
        } catch (err) {
            setError('Failed to add term');
            console.error(err);
        } finally {
            setAddingTerm(false);
        }
    };

    const handleDeleteRequest = (term, year, purchaseCount) => {
        setDeleteTarget({ term, year, purchaseCount });
        setShowDeleteWarning(true);
        setDeleteCountdown(5);
        setCanConfirmDelete(false);
        setDeleteError('');
        setDeleteMessage('');
    };

    const handleCancelDelete = () => {
        setShowDeleteWarning(false);
        setDeleteTarget(null);
        setDeleteCountdown(5);
        setCanConfirmDelete(false);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        setDeleteError('');
        setDeleteMessage('');

        try {
            if (deleteTarget.purchaseCount === 0) {
                // Delete the term from terms table
                const url = `http://localhost:3001/api/settings/term?term=${encodeURIComponent(deleteTarget.term)}&academic_year=${encodeURIComponent(deleteTarget.year)}`;

                const response = await fetch(url, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to delete term');
                }

                setDeleteMessage(`Successfully deleted ${deleteTarget.term} ${deleteTarget.year}`);
            } else {
                // Delete purchase data
                const url = `http://localhost:3001/api/purchases/bulk-delete?term=${encodeURIComponent(deleteTarget.term)}&academic_year=${encodeURIComponent(deleteTarget.year)}`;

                const response = await fetch(url, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to delete purchases');
                }

                setDeleteMessage(`Successfully deleted ${data.count} purchase(s) from ${deleteTarget.term} ${deleteTarget.year}`);
            }

            // Close modal and reset after brief delay to show success
            setTimeout(() => {
                setShowDeleteWarning(false);
                setDeleteTarget(null);
                setDeleteCountdown(5);
                setCanConfirmDelete(false);
                setDeleteMessage('');
            }, 2000);

            // Refresh the terms list
            await fetchAllTerms();
        } catch (err) {
            console.error('Delete error:', err);
            setDeleteError('Failed to delete: ' + err.message);
        } finally {
            setDeleting(false);
        }
    }; if (loading) {
        return <div className="admin-section">Loading...</div>;
    }

    const isActive = (term, year) => term === currentTerm && year === currentYear;

    return (
        <div className="admin-section term-settings">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setShowHelpModal(true)}
                    className="info-icon-btn"
                    title="How term management works"
                    style={{
                        background: '#e7f3ff',
                        border: '2px solid #b3d9ff',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        minWidth: '36px',
                        minHeight: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        padding: 0,
                        flexShrink: 0
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#d0e7ff'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#e7f3ff'}
                >
                    <Info size={20} color="#0066cc" strokeWidth={2.5} />
                </button>
                <span style={{ color: '#666', fontSize: '0.95rem' }}>
                    Manage academic terms and set which term is active for recording new purchases.
                </span>
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            {/* Terms Table */}
            <div className="terms-list-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0 }}>Terms</h3>
                    <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add</button>
                </div>
                {allTerms.length > 0 ? (
                    <div className="terms-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>Term</th>
                                    <th className="col-purchases">Purchases</th>
                                    <th>Status</th>
                                    <th className="col-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allTerms.map((t, idx) => (
                                    <tr key={idx}>
                                        <td>{t.term} {t.academic_year}</td>
                                        <td className="col-purchases">{t.purchase_count || 0}</td>
                                        <td>
                                            {isActive(t.term, t.academic_year) ? (
                                                <span className="status-badge">Active</span>
                                            ) : (
                                                <span className="status-inactive">Inactive</span>
                                            )}
                                        </td>
                                        <td className="col-actions">
                                            {!isActive(t.term, t.academic_year) && (
                                                <>
                                                    <button
                                                        onClick={() => handleSetActive(t.term, t.academic_year)}
                                                        className="table-button set-active"
                                                    >
                                                        Set Active
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRequest(t.term, t.academic_year, t.purchase_count)}
                                                        className="table-button delete-btn"
                                                        disabled={deleting}
                                                    >
                                                        {t.purchase_count === 0 ? 'Delete Term' : 'Delete Data'}
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="info-box">
                        No terms configured yet. Add a term above to get started.
                    </div>
                )}
            </div>

            {/* Help Modal */}
            <FormModal
                open={showHelpModal}
                title="How Term Management Works"
                onClose={() => setShowHelpModal(false)}
            >
                <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                    <p style={{ marginTop: 0 }}>
                        Term management allows you to organize purchases by academic terms and years.
                    </p>
                    <ul style={{ marginLeft: '1.5rem', color: '#555' }}>
                        <li>The <strong>active term</strong> is automatically used for all new purchases</li>
                        <li>Add new terms at the start of each academic period</li>
                        <li>Switch the active term by clicking "Set Active" on any term</li>
                        <li>Delete old term data after exporting for your records</li>
                        <li>Terms are ordered with the most recent first (Trinity → Hilary → Michaelmas)</li>
                    </ul>
                </div>
            </FormModal>

            {/* Add Term Modal */}
            <FormModal
                open={showAddModal}
                title="Add New Term"
                onClose={() => setShowAddModal(false)}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label htmlFor="new-term" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Term</label>
                        <select
                            id="new-term"
                            value={newTerm}
                            onChange={(e) => setNewTerm(e.target.value)}
                            className="form-input"
                            disabled={addingTerm}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '2px solid #ddd' }}
                        >
                            {TERMS.map(term => (
                                <option key={term} value={term}>{term}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="new-year" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Academic Year</label>
                        <select
                            id="new-year"
                            value={newYear}
                            onChange={(e) => setNewYear(e.target.value)}
                            className="form-input"
                            disabled={addingTerm}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '2px solid #ddd' }}
                        >
                            {ACADEMIC_YEARS.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-modal-actions">
                    <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        disabled={addingTerm}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleAddTerm}
                        disabled={addingTerm}
                        className="primary"
                    >
                        {addingTerm ? 'Adding...' : 'Add Term'}
                    </button>
                </div>
            </FormModal>

            {/* Delete Warning Modal */}
            <FormModal
                open={showDeleteWarning}
                title={!deleteMessage ? `⚠️ Confirm ${deleteTarget?.purchaseCount === 0 ? 'Deletion' : 'Data Deletion'} of ${deleteTarget?.term} ${deleteTarget?.year}` : ''}
                onClose={deleteMessage ? null : handleCancelDelete}
            >
                {deleteMessage ? (
                    <div className="success-container" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 1rem',
                            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            color: 'white',
                            fontWeight: 'bold',
                            animation: 'successPulse 0.5s ease'
                        }}>✓</div>
                        <h3 style={{ marginBottom: '0.5rem', color: '#4CAF50', fontSize: '1.3rem', fontWeight: '700' }}>Deletion Successful!</h3>
                        <p style={{ color: '#666', margin: 0 }}>{deleteMessage}</p>
                    </div>
                ) : (
                    <>
                        {deleteError && <div className="error-message" style={{ marginBottom: '1rem' }}>{deleteError}</div>}

                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>
                                <strong>
                                    {deleteTarget?.purchaseCount === 0
                                        ? `This will permanently delete the term ${deleteTarget?.term} ${deleteTarget?.year}.`
                                        : `This will permanently delete all purchase records for ${deleteTarget?.term} ${deleteTarget?.year}.`
                                    }
                                </strong>
                            </p>
                            <ul style={{ marginLeft: '1.5rem', color: '#856404' }}>
                                <li>Deleted data cannot be recovered</li>
                                {deleteTarget?.purchaseCount > 0 && (
                                    <li>Export purchase data before deleting if you need records</li>
                                )}
                                <li>Staff and item records will not be affected</li>
                            </ul>
                        </div>

                        <div className="form-modal-actions">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            {!canConfirmDelete ? (
                                <button
                                    type="button"
                                    disabled
                                    className="primary"
                                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                                >
                                    Confirm Delete ({deleteCountdown}s)
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleDeleteConfirm}
                                    disabled={deleting}
                                    className="primary"
                                    style={{ backgroundColor: '#dc3545', color: 'white', fontWeight: '600' }}
                                >
                                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </FormModal>
        </div>
    );
}

export default TermSettings;
