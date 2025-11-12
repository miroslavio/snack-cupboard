import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './staff.css';
import ConfirmModal from '../ConfirmModal';
import FormModal from '../FormModal';

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
    const [showAddForm, setShowAddForm] = useState(false);
    const [showImportForm, setShowImportForm] = useState(false);

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
            setShowImportForm(false);
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
                setShowImportForm(false);
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
            setShowAddForm(false);
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
            setShowAddForm(false);
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
            <div className="search-bar-container">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input className="search-input" placeholder="Search" value={search} onChange={e => { setSearch(e.target.value); fetchStaff(e.target.value); }} />
                </div>
                <button className="add-button secondary" onClick={() => setShowImportForm(true)}>Import</button>
                <button className="add-button" onClick={() => setShowAddForm(true)}>+ Add</button>
            </div>

            <div className="staff-list">
                <table>
                    <thead>
                        <tr>
                            <th>Forename</th>
                            <th>Surname</th>
                            <th>Initials</th>
                            <th className="col-staffid">Staff ID</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} className="no-results">No staff found</td></tr>
                        ) : (
                            filtered.map(s => (
                                <tr key={s.staffId}>
                                    {editingId === s.staffId ? (
                                        <>
                                            <td>
                                                <input className="edit-input" value={editForename} onChange={e => setEditForename(e.target.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') saveEdit(s.staffId); if (ev.key === 'Escape') cancelEdit(); }} />
                                            </td>
                                            <td>
                                                <input className="edit-input" value={editSurname} onChange={e => setEditSurname(e.target.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') saveEdit(s.staffId); if (ev.key === 'Escape') cancelEdit(); }} />
                                            </td>
                                            <td>
                                                <input className="edit-input" value={editInitials} onChange={e => setEditInitials(e.target.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') saveEdit(s.staffId); if (ev.key === 'Escape') cancelEdit(); }} />
                                            </td>
                                            <td className="col-staffid">{s.staffId}</td>
                                            <td className="col-actions">
                                                <button onClick={() => saveEdit(s.staffId)} className="table-button">Save</button>
                                                <button onClick={cancelEdit} className="table-button">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="staff-main">{s.forename}</td>
                                            <td className="staff-main">{s.surname}</td>
                                            <td className="staff-main">{s.initials}</td>
                                            <td className="col-staffid">{s.staffId}</td>
                                            <td className="col-actions">
                                                <button onClick={() => startEdit(s)} className="table-button">Edit</button>
                                                <button className="delete-btn table-button" onClick={() => handleDeleteRequest(s.staffId, `${s.forename} ${s.surname}`)}>Delete</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {message && <div className="message">{message}</div>}

            <FormModal open={showImportForm} title="Import Staff (CSV)" onClose={() => { setCsvText(''); setShowImportForm(false); }}>
                <div style={{ marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 0.75rem 0', color: '#666' }}>Upload a CSV file or paste CSV text below. Format: StaffID,Initials,Surname,Forename</p>
                    <input type="file" accept="text/csv" onChange={e => handleFileImport(e.target.files[0])} style={{ marginBottom: '1rem' }} />
                    <p style={{ margin: '1rem 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>Or paste CSV text:</p>
                    <textarea 
                        rows={8} 
                        value={csvText} 
                        onChange={e => setCsvText(e.target.value)} 
                        placeholder={`StaffID,Initials,Surname,Forename\n001,AB,Smith,Alan\n002,CD,Jones,Carol`}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '2px solid #ddd', fontFamily: 'monospace' }}
                    />
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#999' }}>⚠️ This will replace all existing staff members</p>
                </div>
                <div className="form-modal-actions">
                    <button type="button" onClick={() => { setCsvText(''); setShowImportForm(false); }}>Cancel</button>
                    <button type="submit" className="primary" onClick={handleImport}>Import</button>
                </div>
            </FormModal>

            <FormModal open={showAddForm} title="Add New Staff Member" onClose={() => { setNewStaffId(''); setNewInitials(''); setNewForename(''); setNewSurname(''); setShowAddForm(false); }}>
                <div className="staff-add">
                    <input placeholder="StaffID" value={newStaffId} onChange={e => setNewStaffId(e.target.value)} onKeyDown={handleAddKeyDown} autoFocus />
                    <input placeholder="Initials" value={newInitials} onChange={e => setNewInitials(e.target.value)} onKeyDown={handleAddKeyDown} />
                    <input placeholder="Forename" value={newForename} onChange={e => setNewForename(e.target.value)} onKeyDown={handleAddKeyDown} />
                    <input placeholder="Surname" value={newSurname} onChange={e => setNewSurname(e.target.value)} onKeyDown={handleAddKeyDown} />
                </div>
                <div className="form-modal-actions">
                    <button type="button" onClick={() => { setNewStaffId(''); setNewInitials(''); setNewForename(''); setNewSurname(''); setShowAddForm(false); }}>Cancel</button>
                    <button type="submit" className="primary" onClick={handleAdd}>Add Staff</button>
                </div>
            </FormModal>

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
