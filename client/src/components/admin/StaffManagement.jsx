import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './staff.css';
import ConfirmModal from '../ConfirmModal';

export default function StaffManagement() {
    const [csvText, setCsvText] = useState('');
    const [message, setMessage] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [search, setSearch] = useState('');

    const [newStaffId, setNewStaffId] = useState('');
    const [newInitials, setNewInitials] = useState('');
    const [newForename, setNewForename] = useState('');
    const [newSurname, setNewSurname] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editInitials, setEditInitials] = useState('');
    const [editForename, setEditForename] = useState('');
    const [editSurname, setEditSurname] = useState('');

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async (q = '') => {
        try {
            const res = await axios.get('/api/staff', { params: { search: q } });
            setStaffList(res.data);
        } catch (err) {
            console.error(err);
            setMessage('Error loading staff list');
        }
    };

    const handleImport = async () => {
        try {
            const response = await axios.post('/api/staff/import', csvText, {
                headers: { 'Content-Type': 'text/csv' }
            });
            setMessage(response.data.message);
            setCsvText('');
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
                const res = await axios.post('/api/staff/import', text, { headers: { 'Content-Type': 'text/csv' } });
                setMessage(res.data.message);
                fetchStaff();
            } catch (err) {
                setMessage('Error importing staff file: ' + (err.response?.data?.error ?? err.message));
            }
        };
        reader.readAsText(file);
    };

    const handleAdd = async () => {
        try {
            if (!newStaffId || !newInitials || !newForename || !newSurname) return setMessage('All fields required');
            // client-side duplicate check for StaffID
            const exists = staffList.some(s => s.staffId && s.staffId.toLowerCase() === newStaffId.trim().toLowerCase());
            if (exists) return setMessage('A staff member with that StaffID already exists');
            const res = await axios.post('/api/staff', {
                staffId: newStaffId,
                initials: newInitials,
                surname: newSurname,
                forename: newForename
            });
            setMessage(res.data.message || 'Staff added');
            setNewStaffId(''); setNewInitials(''); setNewForename(''); setNewSurname('');
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
            setNewStaffId(''); setNewInitials(''); setNewForename(''); setNewSurname('');
        }
    }

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState(null);

    const handleDeleteRequest = (staffId, displayName) => {
        setConfirmTarget({ staffId, displayName });
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!confirmTarget) return setConfirmOpen(false);
        const staffId = confirmTarget.staffId;
        try {
            const res = await axios.delete(`/api/staff/${encodeURIComponent(staffId)}`);
            setMessage(res.data.message || 'Deleted');
            setConfirmOpen(false);
            setConfirmTarget(null);
            fetchStaff();
        } catch (err) {
            setMessage('Error deleting staff: ' + (err.response?.data?.error ?? err.message));
            setConfirmOpen(false);
            setConfirmTarget(null);
        }
    };

    const startEdit = (s) => {
        setEditingId(s.staffId);
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

    const saveEdit = async (staffId) => {
        try {
            if (!editInitials || !editForename || !editSurname) return setMessage('All fields required');
            const res = await axios.put(`/api/staff/${encodeURIComponent(staffId)}`, {
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
        return (`${s.forename} ${s.surname}`.toLowerCase().includes(q) || s.initials.toLowerCase().includes(q) || s.staffId.toLowerCase().includes(q));
    });

    return (
        <div className="staff-management">
            <h3>Manage Staff</h3>

            <div className="staff-add">
                <input placeholder="StaffID" value={newStaffId} onChange={e => setNewStaffId(e.target.value)} onKeyDown={handleAddKeyDown} />
                <input placeholder="Initials" value={newInitials} onChange={e => setNewInitials(e.target.value)} onKeyDown={handleAddKeyDown} />
                <input placeholder="Forename" value={newForename} onChange={e => setNewForename(e.target.value)} onKeyDown={handleAddKeyDown} />
                <input placeholder="Surname" value={newSurname} onChange={e => setNewSurname(e.target.value)} onKeyDown={handleAddKeyDown} />
                <button onClick={handleAdd}>Add Staff</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <h4 style={{ margin: 0 }}>Staff Members</h4>
                <input placeholder="Search staff..." value={search} onChange={e => { setSearch(e.target.value); fetchStaff(e.target.value); }} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ddd' }} />
            </div>

            <div className="staff-list">
                {filtered.length === 0 ? (
                    <div className="no-results">No staff found</div>
                ) : (
                    filtered.map(s => (
                        <div key={s.staffId} className="staff-row">
                            {editingId === s.staffId ? (
                                <>
                                    <div style={{ flex: 1 }}>
                                        <input className="edit-input" value={editForename} onChange={e => setEditForename(e.target.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') saveEdit(s.staffId); if (ev.key === 'Escape') cancelEdit(); }} />
                                        <input className="edit-input" value={editSurname} onChange={e => setEditSurname(e.target.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') saveEdit(s.staffId); if (ev.key === 'Escape') cancelEdit(); }} />
                                        <input className="edit-input" value={editInitials} onChange={e => setEditInitials(e.target.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') saveEdit(s.staffId); if (ev.key === 'Escape') cancelEdit(); }} />
                                    </div>
                                    <div className="staff-actions-row">
                                        <button onClick={() => saveEdit(s.staffId)}>Save</button>
                                        <button onClick={cancelEdit} style={{ marginLeft: 8 }}>Cancel</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="staff-main">{s.forename} {s.surname} <span className="initials">{s.initials}</span></div>
                                    <div className="staff-meta">{s.staffId}</div>
                                    <div className="staff-actions-row">
                                        <button onClick={() => startEdit(s)}>Edit</button>
                                        <button className="delete-btn" onClick={() => handleDeleteRequest(s.staffId, `${s.forename} ${s.surname}`)} style={{ marginLeft: 8 }}>Delete</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            <hr />

            <h4>Import Staff List (CSV)</h4>
            <p>Upload a CSV with headers: StaffID, Initials, Surname, Forename</p>
            <input type="file" accept="text/csv" onChange={e => handleFileImport(e.target.files[0])} />

            <p>Or paste CSV text below and click Import (will replace existing list):</p>
            <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`StaffID,Initials,Surname,Forename\n001,AB,Smith,Alan`}
            />
            <div className="staff-actions">
                <button onClick={handleImport}>Import CSV</button>
            </div>

            {message && <div className="message">{message}</div>}

            <ConfirmModal
                open={confirmOpen}
                title="Delete staff member"
                message={confirmTarget ? `Are you sure you want to delete ${confirmTarget.displayName} (${confirmTarget.staffId})? This cannot be undone.` : 'Are you sure?'}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
            />
        </div>
    );
}
