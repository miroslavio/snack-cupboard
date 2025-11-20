import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import './admin-common.css';
import ConfirmModal from '../ConfirmModal';
import FormModal from '../FormModal';

export default function ItemsManagement() {
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Food');
    const [csvText, setCsvText] = useState('');
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editCategory, setEditCategory] = useState('Food');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showImportForm, setShowImportForm] = useState(false);
    const [importMode, setImportMode] = useState('append'); // 'append' or 'replace'
    const [showArchived, setShowArchived] = useState(false);
    const [hardDeleteConfirmOpen, setHardDeleteConfirmOpen] = useState(false);
    const [hardDeleteTarget, setHardDeleteTarget] = useState(null);
    const [selectedItemIds, setSelectedItemIds] = useState(new Set());
    const [bulkArchiveConfirmOpen, setBulkArchiveConfirmOpen] = useState(false);
    const [bulkRestoreConfirmOpen, setBulkRestoreConfirmOpen] = useState(false);
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    useEffect(() => { fetchItems(); }, []);

    useEffect(() => {
        fetchItems();
    }, [showArchived]);

    const fetchItems = async () => {
        try {
            const res = await axios.get('/api/items', {
                params: { includeArchived: showArchived }
            });
            setItems(res.data);
        } catch (err) {
            console.error(err);
            setMessage('Error loading items');
        }
    };

    const handleAdd = async () => {
        try {
            const p = parseFloat(price);
            if (!name || isNaN(p)) return setMessage('Name and valid price required');
            // Client-side duplicate check removed - server handles it and will restore archived items
            await axios.post('/api/items', { name, price: p, category });
            setName(''); setPrice(''); setCategory('Food');
            setShowAddForm(false);
            setMessage('');
            fetchItems();
            setMessage('Item added');
        } catch (err) {
            setMessage('Error adding item: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/items/${id}`);
            fetchItems();
        } catch (err) {
            setMessage('Error deleting item');
        }
    };

    const handleDeleteRequest = (item) => {
        setConfirmTarget(item);
        setConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!confirmTarget) return setConfirmOpen(false);
        try {
            await axios.delete(`/api/items/${confirmTarget.id}`);
            setMessage('Item deleted');
            setConfirmOpen(false);
            setConfirmTarget(null);
            fetchItems();
        } catch (err) {
            setMessage('Error deleting item: ' + (err.response?.data?.error ?? err.message));
            setConfirmOpen(false);
            setConfirmTarget(null);
        }
    };

    const handleRestore = async (id, name) => {
        try {
            const res = await axios.put(`/api/items/${id}/restore`);
            setMessage(res.data.message || `Restored ${name}`);
            fetchItems();
        } catch (err) {
            setMessage('Error restoring item: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleHardDeleteRequest = (item) => {
        setHardDeleteTarget(item);
        setHardDeleteConfirmOpen(true);
    };

    const handleHardDelete = async () => {
        if (!hardDeleteTarget) return setHardDeleteConfirmOpen(false);
        try {
            const res = await axios.delete(`/api/items/${hardDeleteTarget.id}/permanent`);
            setMessage(res.data.message || 'Permanently deleted');
            setHardDeleteConfirmOpen(false);
            setHardDeleteTarget(null);
            fetchItems();
        } catch (err) {
            setMessage('Error permanently deleting item: ' + (err.response?.data?.error ?? err.message));
            setHardDeleteConfirmOpen(false);
            setHardDeleteTarget(null);
        }
    };

    const toggleSelectItem = (itemId) => {
        const newSet = new Set(selectedItemIds);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setSelectedItemIds(newSet);
    };

    const toggleSelectAll = () => {
        const filtered = items.filter(it => !search || it.name.toLowerCase().includes(search.toLowerCase()));
        if (selectedItemIds.size === filtered.length) {
            setSelectedItemIds(new Set());
        } else {
            setSelectedItemIds(new Set(filtered.map(it => it.id)));
        }
    };

    const handleBulkArchive = async () => {
        setBulkArchiveConfirmOpen(false);
        try {
            const activeIds = selectedActive.map(it => it.id);
            const res = await axios.post('/api/items/bulk/archive', { itemIds: activeIds });
            setMessage(res.data.message);
            setSelectedItemIds(new Set());
            fetchItems();
        } catch (err) {
            setMessage('Error archiving items: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleBulkRestore = async () => {
        setBulkRestoreConfirmOpen(false);
        try {
            const archivedIds = selectedArchived.map(it => it.id);
            const res = await axios.post('/api/items/bulk/restore', { itemIds: archivedIds });
            setMessage(res.data.message);
            setSelectedItemIds(new Set());
            fetchItems();
        } catch (err) {
            setMessage('Error restoring items: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleBulkDelete = async () => {
        setBulkDeleteConfirmOpen(false);
        try {
            const archivedIds = selectedArchived.map(it => it.id);
            const res = await axios.post('/api/items/bulk/delete-permanent', { itemIds: archivedIds });
            setMessage(res.data.message);
            setSelectedItemIds(new Set());
            fetchItems();
        } catch (err) {
            setMessage('Error permanently deleting items: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditName(item.name || '');
        setEditPrice(item.price != null ? String(item.price) : '');
        setEditCategory(item.category || 'Food');
        setMessage('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditPrice('');
        setEditCategory('Food');
    };

    const saveEdit = async (id) => {
        try {
            const p = parseFloat(editPrice);
            if (!editName || isNaN(p)) return setMessage('Name and valid price required');
            // Client-side duplicate check excluding current item
            if (items.some(i => i.name.toLowerCase() === editName.toLowerCase() && i.id !== id)) {
                return setMessage('Another item with that name already exists');
            }
            const res = await axios.put(`/api/items/${id}`, { name: editName, price: p, category: editCategory });
            setMessage(res.data?.message || 'Item updated');
            cancelEdit();
            fetchItems();
        } catch (err) {
            setMessage('Error updating item: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleFileImport = async (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            try {
                const res = await axios.post(`/api/items/import-csv?mode=${importMode}`, text, { headers: { 'Content-Type': 'text/csv' } });
                setMessage(res.data.message);
                setShowImportForm(false);
                setImportMode('append');
                fetchItems();
            } catch (err) {
                setMessage('Error importing items file: ' + (err.response?.data?.error ?? err.message));
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        try {
            const res = await axios.post(`/api/items/import-csv?mode=${importMode}`, csvText, { headers: { 'Content-Type': 'text/csv' } });
            setMessage(res.data.message);
            setCsvText('');
            setShowImportForm(false);
            setImportMode('append');
            fetchItems();
        } catch (err) {
            setMessage('Error importing items: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = [...items].sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredItems = sortedItems.filter(it => !search || it.name.toLowerCase().includes(search.toLowerCase()));
    const selectedItems = filteredItems.filter(it => selectedItemIds.has(it.id));
    const selectedActive = selectedItems.filter(it => !it.archived_at);
    const selectedArchived = selectedItems.filter(it => it.archived_at);

    return (
        <div className="admin-section items-management">
            <div className="search-bar-container">
                <div className="search-container">
                    <Search size={20} />
                    <input className="search-input" placeholder="Search items" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="add-button secondary" onClick={() => setShowImportForm(true)}>Import</button>
                <button className="add-button" onClick={() => setShowAddForm(true)}>+ Add</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={e => setShowArchived(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                    />
                    <span>Show archived items</span>
                </label>
            </div>

            <div className="table-container">
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={filteredItems.length > 0 && selectedItemIds.size === filteredItems.length}
                                        onChange={toggleSelectAll}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </th>
                                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="col-price" onClick={() => handleSort('price')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(it => {
                                const isArchived = it.archived_at !== null;
                                return (
                                    <tr key={it.id} className={isArchived ? 'archived-row' : ''}>
                                        {editingId === it.id && !isArchived ? (
                                            <>
                                                <td style={{ textAlign: 'center' }}></td>
                                                <td>
                                                    <input className="edit-input" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(it.id); if (e.key === 'Escape') cancelEdit(); }} />
                                                </td>
                                                <td>
                                                    <select className="edit-input" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                                                        <option value="Food">Food</option>
                                                        <option value="Drink">Drink</option>
                                                    </select>
                                                </td>
                                                <td className="col-price">
                                                    <input className="edit-input" value={editPrice} onChange={e => setEditPrice(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(it.id); if (e.key === 'Escape') cancelEdit(); }} />
                                                </td>
                                                <td className="col-actions">
                                                    <button onClick={() => saveEdit(it.id)} className="table-button">Save</button>
                                                    <button onClick={cancelEdit} className="table-button">Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItemIds.has(it.id)}
                                                        onChange={() => toggleSelectItem(it.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </td>
                                                <td className="item-main">{it.name}</td>
                                                <td>
                                                    <span className={`category-badge ${(it.category || 'Food').toLowerCase()}`}>
                                                        {it.category || 'Food'}
                                                    </span>
                                                </td>
                                                <td className="col-price">£{it.price.toFixed(2)}</td>
                                                <td className="col-actions">
                                                    {isArchived ? (
                                                        <>
                                                            <button onClick={() => handleRestore(it.id, it.name)} className="table-button" style={{ background: '#667eea', color: 'white' }}>Restore</button>
                                                            <button onClick={() => handleHardDeleteRequest(it)} className="delete-btn table-button">Delete</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEdit(it)} className="table-button">Edit</button>
                                                            <button onClick={() => handleDeleteRequest(it)} className="table-button" style={{ background: '#ff9800', color: 'white' }}>Archive</button>
                                                        </>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {selectedItemIds.size > 0 && (
                    <div className="bulk-actions">
                        <span style={{ fontWeight: 600 }}>{selectedItemIds.size} selected</span>
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
                            onClick={() => setSelectedItemIds(new Set())}
                            className="table-button"
                            style={{ marginLeft: 'auto' }}
                        >
                            Clear Selection
                        </button>
                    </div>
                )}
            </div>

            {message && <div className="message">{message}</div>}

            <FormModal open={showImportForm} title="Import Items (CSV)" onClose={() => { setCsvText(''); setImportMode('append'); setShowImportForm(false); }}>
                <div>
                    <div className="modal-option-row">
                        <label>
                            <input
                                type="checkbox"
                                checked={importMode === 'replace'}
                                onChange={e => setImportMode(e.target.checked ? 'replace' : 'append')}
                            />
                            <span><strong>Replace mode</strong> (unchecked = append new/update existing)</span>
                        </label>
                    </div>
                    {importMode === 'replace' && (
                        <div className="modal-warning danger">
                            <strong>Warning:</strong> Replace mode will remove all existing items and import only the CSV list.
                        </div>
                    )}
                    <p className="modal-note">Upload a CSV file or paste CSV text below. Format: <code>name,price,category</code> (category optional, defaults to Food)</p>
                    <input type="file" accept="text/csv" onChange={e => handleFileImport(e.target.files[0])} style={{ marginBottom: '1rem' }} />
                    <p className="modal-note">Or paste CSV text:</p>
                    <textarea
                        rows={8}
                        value={csvText}
                        onChange={e => setCsvText(e.target.value)}
                        placeholder={`name,price,category\nChocolate Bar,1.25,Food\nCoke,1.50,Drink`}
                        className="csv-textarea"
                    />
                </div>
                <div className="form-modal-actions">
                    <button type="button" onClick={() => { setCsvText(''); setImportMode('append'); setShowImportForm(false); }}>Cancel</button>
                    <button type="submit" className="primary" onClick={handleImport}>Import</button>
                </div>
            </FormModal>

            <FormModal open={showAddForm} title="Add New Item" onClose={() => { setName(''); setPrice(''); setCategory('Food'); setShowAddForm(false); setMessage(''); }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <label htmlFor="item-name" style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Item Name</label>
                        <input id="item-name" value={name} onChange={e => setName(e.target.value)} placeholder="Item name" onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} autoFocus style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '2px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '1rem' }} />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label htmlFor="item-category" style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Category</label>
                        <select id="item-category" value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '2px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }}>
                            <option value="Food">Food</option>
                            <option value="Drink">Drink</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label htmlFor="item-price" style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Price</label>
                        <input id="item-price" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price (£)" onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '2px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '1rem' }} />
                    </div>
                </div>
                {message && showAddForm && (
                    <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', backgroundColor: message.includes('Error') || message.includes('exists') ? '#fee' : '#efe', color: message.includes('Error') || message.includes('exists') ? '#c33' : '#363', fontSize: '0.9rem' }}>
                        {message}
                    </div>
                )}
                <div className="form-modal-actions">
                    <button type="button" onClick={() => { setName(''); setPrice(''); setCategory('Food'); setShowAddForm(false); setMessage(''); }}>Cancel</button>
                    <button type="submit" className="primary" onClick={handleAdd}>Add Item</button>
                </div>
            </FormModal>

            <ConfirmModal
                open={confirmOpen}
                title="Archive item"
                message={confirmTarget ? `Are you sure you want to archive ${confirmTarget.name}? It will be hidden but can be restored later.` : 'Are you sure?'}
                confirmText="Archive"
                onConfirm={handleDeleteConfirm}
                onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
            />

            <ConfirmModal
                open={hardDeleteConfirmOpen}
                title="⚠️ Permanently Delete Item"
                message={hardDeleteTarget ? `This will PERMANENTLY delete ${hardDeleteTarget.name} from the database. Purchase records will remain but will no longer link to an item. This action CANNOT be undone.` : 'Are you sure?'}
                onConfirm={handleHardDelete}
                onCancel={() => { setHardDeleteConfirmOpen(false); setHardDeleteTarget(null); }}
            />

            <ConfirmModal
                open={bulkArchiveConfirmOpen}
                title="Archive Multiple Items"
                message={`Archive ${selectedActive.length} item(s)?`}
                confirmText="Archive"
                onConfirm={handleBulkArchive}
                onCancel={() => setBulkArchiveConfirmOpen(false)}
            />

            <ConfirmModal
                open={bulkRestoreConfirmOpen}
                title="Restore Multiple Items"
                message={`Restore ${selectedArchived.length} archived item(s)?`}
                confirmText="Restore"
                onConfirm={handleBulkRestore}
                onCancel={() => setBulkRestoreConfirmOpen(false)}
            />

            <ConfirmModal
                open={bulkDeleteConfirmOpen}
                title="⚠️ Permanently Delete Multiple Items"
                message={`This will PERMANENTLY delete ${selectedArchived.length} archived item(s) from the database. This action CANNOT be undone.`}
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteConfirmOpen(false)}
            />
        </div>
    );
}
