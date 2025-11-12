import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './items.css';
import ConfirmModal from '../ConfirmModal';

export default function ItemsManagement() {
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [csvText, setCsvText] = useState('');
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        try {
            const res = await axios.get('/api/items');
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
            // Client-side duplicate check (case-insensitive)
            if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
                return setMessage('An item with that name already exists');
            }
            await axios.post('/api/items', { name, price: p });
            setName(''); setPrice('');
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

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditName(item.name || '');
        setEditPrice(item.price != null ? String(item.price) : '');
        setMessage('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditPrice('');
    };

    const saveEdit = async (id) => {
        try {
            const p = parseFloat(editPrice);
            if (!editName || isNaN(p)) return setMessage('Name and valid price required');
            // Client-side duplicate check excluding current item
            if (items.some(i => i.name.toLowerCase() === editName.toLowerCase() && i.id !== id)) {
                return setMessage('Another item with that name already exists');
            }
            const res = await axios.put(`/api/items/${id}`, { name: editName, price: p });
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
                const res = await axios.post('/api/items/import-csv', text, { headers: { 'Content-Type': 'text/csv' } });
                setMessage(res.data.message);
                fetchItems();
            } catch (err) {
                setMessage('Error importing items file: ' + (err.response?.data?.error ?? err.message));
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        try {
            const res = await axios.post('/api/items/import-csv', csvText, { headers: { 'Content-Type': 'text/csv' } });
            setMessage(res.data.message);
            fetchItems();
        } catch (err) {
            setMessage('Error importing items: ' + (err.response?.data?.error ?? err.message));
        }
    };

    return (
        <div className="items-management">
            <h3>Manage Items</h3>

            <div className="add-item">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setName(''); setPrice(''); } }} />
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price (£)" onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setName(''); setPrice(''); } }} />
                <button onClick={handleAdd}>Add Item</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <h4 style={{ margin: 0 }}>Items</h4>
                <input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ddd' }} />
            </div>

            <div className="items-list">
                {items.filter(it => !search || it.name.toLowerCase().includes(search.toLowerCase())).map(it => (
                    <div key={it.id} className="item-row">
                        {editingId === it.id ? (
                            <>
                                <div style={{ flex: 1 }}>
                                    <input className="edit-input" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(it.id); if (e.key === 'Escape') cancelEdit(); }} />
                                    <input className="edit-input" value={editPrice} onChange={e => setEditPrice(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(it.id); if (e.key === 'Escape') cancelEdit(); }} />
                                </div>
                                <div>
                                    <button onClick={() => saveEdit(it.id)}>Save</button>
                                    <button onClick={cancelEdit} style={{ marginLeft: 8 }}>Cancel</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="item-main">{it.name}</div>
                                <div className="item-price">£{it.price.toFixed(2)}</div>
                                <div>
                                    <button onClick={() => startEdit(it)}>Edit</button>
                                    <button onClick={() => handleDeleteRequest(it)} style={{ marginLeft: 8 }}>Delete</button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <hr />

            <h4>Import Items (CSV)</h4>
            <p>CSV headers: name,price</p>
            <input type="file" accept="text/csv" onChange={e => handleFileImport(e.target.files[0])} />
            <p>Or paste CSV text below and click Import (will replace existing list):</p>
            <textarea rows={6} value={csvText} onChange={e => setCsvText(e.target.value)} placeholder={`name,price\nChocolate Bar,1.25`}></textarea>
            <div className="items-import-actions">
                <button onClick={handleImport}>Import CSV</button>
            </div>

            {message && <div className="message">{message}</div>}

            <ConfirmModal
                open={confirmOpen}
                title="Delete item"
                message={confirmTarget ? `Are you sure you want to delete ${confirmTarget.name}?` : 'Are you sure?'}
                onConfirm={handleDeleteConfirm}
                onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
            />
        </div>
    );
}
