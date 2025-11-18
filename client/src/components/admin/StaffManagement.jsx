import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import './staff.css';
import ConfirmModal from '../ConfirmModal';
import FormModal from '../FormModal';

export default function StaffManagement() {
    const [csvText, setCsvText] = useState('');
    const [message, setMessage] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [search, setSearch] = useState('');

    const [newInitials, setNewInitials] = useState('');
    const [newForename, setNewForename] = useState('');
    const [newSurname, setNewSurname] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editInitials, setEditInitials] = useState('');
    const [editForename, setEditForename] = useState('');
    const [editSurname, setEditSurname] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showImportForm, setShowImportForm] = useState(false);
    const [importMode, setImportMode] = useState('replace'); // 'replace' or 'append'
    const [showArchived, setShowArchived] = useState(false);
    const [selectedInitials, setSelectedInitials] = useState(new Set());
    const [bulkArchiveConfirmOpen, setBulkArchiveConfirmOpen] = useState(false);
    const [bulkRestoreConfirmOpen, setBulkRestoreConfirmOpen] = useState(false);
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        fetchStaff(search);
    }, [showArchived]);

    const toggleSelectStaff = (initials) => {
        const newSelected = new Set(selectedInitials);
        if (newSelected.has(initials)) {
            newSelected.delete(initials);
        } else {
            newSelected.add(initials);
        }
        setSelectedInitials(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedInitials.size === filtered.length) {
            setSelectedInitials(new Set());
        } else {
            setSelectedInitials(new Set(filtered.map(s => s.initials)));
        }
    };

    const fetchStaff = async (q = '') => {
        try {
            console.log('Fetching staff with includeArchived:', showArchived);
            const res = await axios.get('/api/staff', {
                params: {
                    search: q,
                    includeArchived: showArchived
                }
            });
            console.log('Fetched staff count:', res.data.length);
            setStaffList(res.data);
        } catch (err) {
            console.error(err);
            setMessage('Error loading staff list');
        }
    };

    const handleImport = async () => {
        try {
            const response = await axios.post(`/api/staff/import?mode=${importMode}`, csvText, {
                headers: { 'Content-Type': 'text/csv' }
            });
            setMessage(response.data.message);
            setCsvText('');
            setShowImportForm(false);
            setImportMode('replace');
            fetchStaff();
        } catch (err) {
            setMessage('Error importing staff: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleFileImport = async (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            try {
                const res = await axios.post(`/api/staff/import?mode=${importMode}`, text, { headers: { 'Content-Type': 'text/csv' } });
                setMessage(res.data.message);
                setShowImportForm(false);
                setImportMode('replace');
                fetchStaff();
            } catch (err) {
                setMessage('Error importing staff file: ' + (err.response?.data?.error ?? err.message));
            }
        };
        reader.readAsText(file);
    };

    const handleAdd = async () => {
        try {
            if (!newInitials || !newForename || !newSurname) return setMessage('All fields required');
            const res = await axios.post('/api/staff', {
                initials: newInitials,
                surname: newSurname,
                forename: newForename
            });
            setMessage(res.data.message || 'Staff added');
            setNewInitials(''); setNewForename(''); setNewSurname('');
            setShowAddForm(false);
            setMessage('');
            fetchStaff();
        } catch (err) {
            setMessage('Error adding staff: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleAddKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        } else if (e.key === 'Escape') {
            setNewInitials(''); setNewForename(''); setNewSurname('');
            setShowAddForm(false);
            setMessage('');
        }
    }

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [hardDeleteConfirmOpen, setHardDeleteConfirmOpen] = useState(false);
    const [hardDeleteTarget, setHardDeleteTarget] = useState(null);

    const handleArchiveRequest = (initials, displayName) => {
        setConfirmTarget({ initials, displayName });
        setConfirmOpen(true);
    };

    const handleRestore = async (initials, displayName) => {
        try {
            const res = await axios.put(`/api/staff/${encodeURIComponent(initials)}/restore`);
            setMessage(res.data.message || `Restored ${displayName}`);
            fetchStaff();
        } catch (err) {
            setMessage('Error restoring staff: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleHardDeleteRequest = (initials, displayName) => {
        setHardDeleteTarget({ initials, displayName });
        setHardDeleteConfirmOpen(true);
    };

    const handleHardDelete = async () => {
        if (!hardDeleteTarget) return setHardDeleteConfirmOpen(false);
        const initials = hardDeleteTarget.initials;
        try {
            const res = await axios.delete(`/api/staff/${encodeURIComponent(initials)}/permanent`);
            setMessage(res.data.message || 'Permanently deleted');
            setHardDeleteConfirmOpen(false);
            setHardDeleteTarget(null);
            fetchStaff();
        } catch (err) {
            setMessage('Error permanently deleting staff: ' + (err.response?.data?.error ?? err.message));
            setHardDeleteConfirmOpen(false);
            setHardDeleteTarget(null);
        }
    };

    const handleBulkArchive = async () => {
        setBulkArchiveConfirmOpen(false);
        try {
            // Only send active staff initials
            const activeInitials = selectedActive.map(s => s.initials);
            const res = await axios.post('/api/staff/bulk/archive', { staffInitials: activeInitials });
            setMessage(res.data.message);
            setSelectedInitials(new Set());
            fetchStaff();
        } catch (err) {
            setMessage('Error archiving staff: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleBulkRestore = async () => {
        setBulkRestoreConfirmOpen(false);
        try {
            // Only send archived staff initials
            const archivedInitials = selectedArchived.map(s => s.initials);
            const res = await axios.post('/api/staff/bulk/restore', { staffInitials: archivedInitials });
            setMessage(res.data.message);
            setSelectedInitials(new Set());
            fetchStaff();
        } catch (err) {
            setMessage('Error restoring staff: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleBulkDelete = async () => {
        setBulkDeleteConfirmOpen(false);
        try {
            // Only send archived staff initials
            const archivedInitials = selectedArchived.map(s => s.initials);
            const res = await axios.post('/api/staff/bulk/delete-permanent', { staffInitials: archivedInitials });
            setMessage(res.data.message);
            setSelectedInitials(new Set());
            fetchStaff();
        } catch (err) {
            setMessage('Error permanently deleting staff: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleArchive = async () => {
        if (!confirmTarget) return setConfirmOpen(false);
        const initials = confirmTarget.initials;
        try {
            const res = await axios.delete(`/api/staff/${encodeURIComponent(initials)}`);
            setMessage(res.data.message || 'Archived');
            setConfirmOpen(false);
            setConfirmTarget(null);
            fetchStaff();
        } catch (err) {
            setMessage('Error archiving staff: ' + (err.response?.data?.error ?? err.message));
            setConfirmOpen(false);
            setConfirmTarget(null);
        }
    };

    const startEdit = (s) => {
        setEditingId(s.initials);
        setEditInitials(s.initials || '');
        setEditForename(s.forename || '');
        setEditSurname(s.surname || '');
        setMessage('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditInitials('');
        setEditForename('');
        setEditSurname('');
    };

    const saveEdit = async (initials) => {
        try {
            if (!editInitials || !editForename || !editSurname) return setMessage('All fields required');
            const res = await axios.put(`/api/staff/${encodeURIComponent(initials)}`, {
                initials: editInitials,
                forename: editForename,
                surname: editSurname
            });
            setMessage(res.data.message || 'Updated');
            cancelEdit();
            fetchStaff();
        } catch (err) {
            setMessage('Error updating staff: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const filtered = staffList.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (`${s.forename} ${s.surname}`.toLowerCase().includes(q) || s.initials.toLowerCase().includes(q));
    });

    const selectedStaff = filtered.filter(s => selectedInitials.has(s.initials));
    const selectedActive = selectedStaff.filter(s => !s.archived_at);
    const selectedArchived = selectedStaff.filter(s => s.archived_at);

    return (
        <div className="staff-management">
            <div className="search-bar-container">
                <div className="search-container">
                    <Search size={20} />
                    <input className="search-input" placeholder="Search staff" value={search} onChange={e => { setSearch(e.target.value); fetchStaff(e.target.value); }} />
                </div>
                <button className="add-button secondary" onClick={() => setShowImportForm(true)}>Import</button>
                <button className="add-button" onClick={() => setShowAddForm(true)}>+ Add</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#666' }}>
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={e => setShowArchived(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                    />
                    <span>Show archived staff</span>
                </label>
            </div>

            <div className="staff-list">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={filtered.length > 0 && selectedInitials.size === filtered.length}
                                    onChange={toggleSelectAll}
                                    style={{ cursor: 'pointer' }}
                                />
                            </th>
                            <th>Forename</th>
                            <th>Surname</th>
                            <th>Initials</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} className="no-results">No staff found</td></tr>
                        ) : (
                            filtered.map(s => {
                                const isArchived = s.archived_at !== null;
                                return (
                                    <tr key={s.initials} className={isArchived ? 'archived-row' : ''}>
                                        {editingId === s.initials && !isArchived ? (
                                            <>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedInitials.has(s.initials)}
                                                        onChange={() => toggleSelectStaff(s.initials)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input className="edit-input" value={editForename} onChange={e => setEditForename(e.target.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') saveEdit(s.initials); if (ev.key === 'Escape') cancelEdit(); }} />
                                                </td>
                                                <td>
                                                    <input className="edit-input" value={editSurname} onChange={e => setEditSurname(e.target.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') saveEdit(s.initials); if (ev.key === 'Escape') cancelEdit(); }} />
                                                </td>
                                                <td>
                                                    <input className="edit-input" value={editInitials} onChange={e => setEditInitials(e.target.value.toUpperCase())} onKeyDown={(ev) => { if (ev.key === 'Enter') saveEdit(s.initials); if (ev.key === 'Escape') cancelEdit(); }} />
                                                </td>
                                                <td className="col-actions">
                                                    <button onClick={() => saveEdit(s.initials)} className="table-button">Save</button>
                                                    <button onClick={cancelEdit} className="table-button">Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedInitials.has(s.initials)}
                                                        onChange={() => toggleSelectStaff(s.initials)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </td>
                                                <td className="staff-main">{s.forename}</td>
                                                <td className="staff-main">{s.surname}</td>
                                                <td className="staff-main">{s.initials}</td>
                                                <td className="col-actions">
                                                    {isArchived ? (
                                                        <>
                                                            <button onClick={() => handleRestore(s.initials, `${s.forename} ${s.surname}`)} className="table-button" style={{ background: '#667eea', color: 'white' }}>Restore</button>
                                                            <button onClick={() => handleHardDeleteRequest(s.initials, `${s.forename} ${s.surname}`)} className="delete-btn table-button">Delete</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEdit(s)} className="table-button">Edit</button>
                                                            <button className="table-button" style={{ background: '#ff9800', color: 'white' }} onClick={() => handleArchiveRequest(s.initials, `${s.forename} ${s.surname}`)}>Archive</button>
                                                        </>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {selectedInitials.size > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f0f4ff', border: '2px solid #667eea', borderRadius: '8px', marginTop: '0.75rem' }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>{selectedInitials.size} selected</span>
                    {selectedActive.length > 0 && (
                        <button
                            onClick={() => setBulkArchiveConfirmOpen(true)}
                            className="table-button"
                            style={{ background: '#ff9800', color: 'white' }}
                        >
                            Archive ({selectedActive.length})
                        </button>
                    )}
                    {selectedArchived.length > 0 && (
                        <>
                            <button
                                onClick={() => setBulkRestoreConfirmOpen(true)}
                                className="table-button"
                                style={{ background: '#667eea', color: 'white' }}
                            >
                                Restore ({selectedArchived.length})
                            </button>
                            <button
                                onClick={() => setBulkDeleteConfirmOpen(true)}
                                className="delete-btn table-button"
                            >
                                Delete ({selectedArchived.length})
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setSelectedInitials(new Set())}
                        className="table-button"
                        style={{ marginLeft: 'auto' }}
                    >
                        Clear Selection
                    </button>
                </div>
            )}

            {message && <div className="message">{message}</div>}

            <FormModal open={showImportForm} title="Import Staff (CSV)" onClose={() => { setCsvText(''); setImportMode('replace'); setShowImportForm(false); }}>
                <div style={{ marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 0.75rem 0', color: '#666' }}>Upload a CSV file or paste CSV text below. Format: Initials,Surname,Forename</p>
                    <input type="file" accept="text/csv" onChange={e => handleFileImport(e.target.files[0])} style={{ marginBottom: '1rem' }} />
                    <p style={{ margin: '1rem 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>Or paste CSV text:</p>
                    <textarea
                        rows={8}
                        value={csvText}
                        onChange={e => setCsvText(e.target.value)}
                        placeholder={`Initials,Surname,Forename\nAB,Smith,Alan\nCD,Jones,Carol`}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '2px solid #ddd', fontFamily: 'monospace' }}
                    />
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                checked={importMode === 'append'}
                                onChange={e => setImportMode(e.target.checked ? 'append' : 'replace')}
                                style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: '500' }}>Append mode</span>
                            <span style={{ color: '#666', fontSize: '0.85rem' }}>(keep existing staff, add new ones only)</span>
                        </label>
                    </div>
                    {importMode === 'replace' && (
                        <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#856404', background: '#fff3cd', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ffc107' }}>
                            ⚠️ Replace mode: staff not in the CSV will be archived
                        </p>
                    )}
                </div>
                <div className="form-modal-actions">
                    <button type="button" onClick={() => { setCsvText(''); setImportMode('replace'); setShowImportForm(false); }}>Cancel</button>
                    <button type="submit" className="primary" onClick={handleImport}>Import</button>
                </div>
            </FormModal>

            <FormModal open={showAddForm} title="Add New Staff Member" onClose={() => { setNewInitials(''); setNewForename(''); setNewSurname(''); setShowAddForm(false); setMessage(''); }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <label htmlFor="staff-initials" style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555', fontWeight: '500' }}>Initials</label>
                        <input id="staff-initials" placeholder="Initials" value={newInitials} onChange={e => setNewInitials(e.target.value.toUpperCase())} onKeyDown={handleAddKeyDown} autoFocus style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '2px solid #ddd', boxSizing: 'border-box', fontSize: '1rem' }} />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label htmlFor="staff-forename" style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555', fontWeight: '500' }}>Forename</label>
                        <input id="staff-forename" placeholder="Forename" value={newForename} onChange={e => setNewForename(e.target.value)} onKeyDown={handleAddKeyDown} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '2px solid #ddd', boxSizing: 'border-box', fontSize: '1rem' }} />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label htmlFor="staff-surname" style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#555', fontWeight: '500' }}>Surname</label>
                        <input id="staff-surname" placeholder="Surname" value={newSurname} onChange={e => setNewSurname(e.target.value)} onKeyDown={handleAddKeyDown} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '2px solid #ddd', boxSizing: 'border-box', fontSize: '1rem' }} />
                    </div>
                    {message && showAddForm && (
                        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', backgroundColor: message.includes('Error') || message.includes('exists') ? '#fee' : '#efe', color: message.includes('Error') || message.includes('exists') ? '#c33' : '#363', fontSize: '0.9rem' }}>
                            {message}
                        </div>
                    )}
                </div>
                <div className="form-modal-actions">
                    <button type="button" onClick={() => { setNewInitials(''); setNewForename(''); setNewSurname(''); setShowAddForm(false); setMessage(''); }}>Cancel</button>
                    <button type="submit" className="primary" onClick={handleAdd}>Add Staff</button>
                </div>
            </FormModal>

            <ConfirmModal
                open={confirmOpen}
                title="Archive staff member"
                message={confirmTarget ? `Are you sure you want to archive ${confirmTarget.displayName} (${confirmTarget.initials})? They will be hidden but can be restored later.` : 'Are you sure?'}
                confirmText="Archive"
                onConfirm={handleArchive}
                onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
            />

            <ConfirmModal
                open={hardDeleteConfirmOpen}
                title="⚠️ Permanently Delete Staff Member"
                message={hardDeleteTarget ? `This will PERMANENTLY delete ${hardDeleteTarget.displayName} (${hardDeleteTarget.initials}) from the database. Their purchase records will remain but will no longer link to a staff profile. This action CANNOT be undone.` : 'Are you sure?'}
                onConfirm={handleHardDelete}
                onCancel={() => { setHardDeleteConfirmOpen(false); setHardDeleteTarget(null); }}
            />

            <ConfirmModal
                open={bulkArchiveConfirmOpen}
                title="Archive Multiple Staff Members"
                message={`Archive ${selectedActive.length} staff member(s)?`}
                confirmText="Archive"
                onConfirm={handleBulkArchive}
                onCancel={() => setBulkArchiveConfirmOpen(false)}
            />

            <ConfirmModal
                open={bulkRestoreConfirmOpen}
                title="Restore Multiple Staff Members"
                message={`Restore ${selectedArchived.length} archived staff member(s)?`}
                confirmText="Restore"
                onConfirm={handleBulkRestore}
                onCancel={() => setBulkRestoreConfirmOpen(false)}
            />

            <ConfirmModal
                open={bulkDeleteConfirmOpen}
                title="⚠️ Permanently Delete Multiple Staff"
                message={`This will PERMANENTLY delete ${selectedArchived.length} archived staff member(s) from the database. Their purchase records will remain but will no longer link to staff profiles. This action CANNOT be undone.`}
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteConfirmOpen(false)}
            />
        </div >
    );
}
