import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './items.css';
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
            await axios.post('/api/items', { name, price: p, category });
            setName(''); setPrice(''); setCategory('Food');
            setShowAddForm(false);
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
                const res = await axios.post('/api/items/import-csv', text, { headers: { 'Content-Type': 'text/csv' } });
                setMessage(res.data.message);
                setShowImportForm(false);
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
            setCsvText('');
            setShowImportForm(false);
            fetchItems();
        } catch (err) {
            setMessage('Error importing items: ' + (err.response?.data?.error ?? err.message));
        }
    };

    return (
        <div className="items-management">
            <div className="search-bar-container">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input className="search-input" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="add-button secondary" onClick={() => setShowImportForm(true)}>Import</button>
                <button className="add-button" onClick={() => setShowAddForm(true)}>+ Add</button>
            </div>

            <div className="items-list">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th className="col-price">Price</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.filter(it => !search || it.name.toLowerCase().includes(search.toLowerCase())).map(it => (
                            <tr key={it.id}>
                                {editingId === it.id ? (
                                    <>
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
                                        <td className="item-main">{it.name}</td>
                                        <td>{it.category || 'Food'}</td>
                                        <td className="col-price">£{it.price.toFixed(2)}</td>
                                        <td className="col-actions">
                                            <button onClick={() => startEdit(it)} className="table-button">Edit</button>
                                            <button onClick={() => handleDeleteRequest(it)} className="delete-btn table-button">Delete</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {message && <div className="message">{message}</div>}

            <FormModal open={showImportForm} title="Import Items (CSV)" onClose={() => { setCsvText(''); setShowImportForm(false); }}>
                <div style={{ marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 0.75rem 0', color: '#666' }}>Upload a CSV file or paste CSV text below. Format: name,price,category (category is optional, defaults to Food)</p>
                    <input type="file" accept="text/csv" onChange={e => handleFileImport(e.target.files[0])} style={{ marginBottom: '1rem' }} />
                    <p style={{ margin: '1rem 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>Or paste CSV text:</p>
                    <textarea
                        rows={8}
                        value={csvText}
                        onChange={e => setCsvText(e.target.value)}
                        placeholder={`name,price,category\nChocolate Bar,1.25,Food\nCoke,1.50,Drink`}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '2px solid #ddd', fontFamily: 'monospace' }}
                    />
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#999' }}>⚠️ This will replace all existing items</p>
                </div>
                <div className="form-modal-actions">
                    <button type="button" onClick={() => { setCsvText(''); setShowImportForm(false); }}>Cancel</button>
                    <button type="submit" className="primary" onClick={handleImport}>Import</button>
                </div>
            </FormModal>

            <FormModal open={showAddForm} title="Add New Item" onClose={() => { setName(''); setPrice(''); setCategory('Food'); setShowAddForm(false); }}>
                <div className="add-item">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} autoFocus />
                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '0.75rem', borderRadius: '6px', border: '2px solid #ddd', fontSize: '1rem' }}>
                        <option value="Food">Food</option>
                        <option value="Drink">Drink</option>
                    </select>
                    <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price (£)" onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} />
                </div>
                <div className="form-modal-actions">
                    <button type="button" onClick={() => { setName(''); setPrice(''); setCategory('Food'); setShowAddForm(false); }}>Cancel</button>
                    <button type="submit" className="primary" onClick={handleAdd}>Add Item</button>
                </div>
            </FormModal>

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
