import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import './admin-common.css';
import ConfirmModal from '../ConfirmModal';

export default function PurchasesManagement() {
    const [purchases, setPurchases] = useState([]);
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editStaffId, setEditStaffId] = useState('');
    const [editStaffName, setEditStaffName] = useState('');
    const [editItemName, setEditItemName] = useState('');
    const [editQuantity, setEditQuantity] = useState('');
    const [editTotalPrice, setEditTotalPrice] = useState('');
    const [items, setItems] = useState([]);
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [selectedPurchaseIds, setSelectedPurchaseIds] = useState(new Set());
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        fetchPurchases();
        fetchItems();
    }, []);

    const fetchPurchases = async () => {
        try {
            const res = await axios.get('/api/purchases');
            // Sort by timestamp descending (most recent first)
            const sorted = res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setPurchases(sorted);
        } catch (err) {
            console.error(err);
            setMessage('Error loading purchases');
        }
    };

    const fetchItems = async () => {
        try {
            const res = await axios.get('/api/items');
            setItems(res.data);
        } catch (err) {
            console.error('Error loading items:', err);
        }
    };

    const handleDeleteRequest = (purchase) => {
        setConfirmTarget(purchase);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!confirmTarget) return setConfirmOpen(false);
        try {
            await axios.delete(`/api/purchases/${confirmTarget.id}`);
            setMessage('Purchase deleted');
            setConfirmOpen(false);
            setConfirmTarget(null);
            fetchPurchases();
        } catch (err) {
            setMessage('Error deleting purchase: ' + (err.response?.data?.error ?? err.message));
            setConfirmOpen(false);
            setConfirmTarget(null);
        }
    };

    const startEdit = (p) => {
        setEditingId(p.id);
        setEditStaffId(p.staffId || '');
        setEditStaffName(`${p.forename} ${p.surname}`);
        setEditItemName(p.itemName || '');
        setEditQuantity(p.quantity != null ? String(p.quantity) : '');
        setEditTotalPrice(p.totalPrice != null ? String(p.totalPrice) : '');
        setShowItemDropdown(false);
        setMessage('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditStaffId('');
        setEditStaffName('');
        setEditItemName('');
        setEditQuantity('');
        setEditTotalPrice('');
        setShowItemDropdown(false);
    };

    const handleSelectItem = (itemName) => {
        setEditItemName(itemName);
        setShowItemDropdown(false);
    };

    const handleItemInputChange = (value) => {
        setEditItemName(value);
        setShowItemDropdown(true);
    };

    const getFilteredItems = () => {
        if (!editItemName) return items;
        const query = editItemName.toLowerCase();
        return items.filter(item => item.name.toLowerCase().includes(query));
    };

    const saveEdit = async (id) => {
        try {
            const qty = parseInt(editQuantity);
            const price = parseFloat(editTotalPrice);
            if (!editStaffId || !editItemName || isNaN(qty) || qty <= 0 || isNaN(price)) {
                return setMessage('All fields required with valid quantity and price');
            }
            const res = await axios.put(`/api/purchases/${id}`, {
                staffId: editStaffId,
                itemName: editItemName,
                quantity: qty,
                totalPrice: price
            });
            setMessage(res.data?.message || 'Purchase updated');
            cancelEdit();
            fetchPurchases();
        } catch (err) {
            setMessage('Error updating purchase: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const toggleSelectPurchase = (purchaseId) => {
        const newSet = new Set(selectedPurchaseIds);
        if (newSet.has(purchaseId)) {
            newSet.delete(purchaseId);
        } else {
            newSet.add(purchaseId);
        }
        setSelectedPurchaseIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedPurchaseIds.size === filtered.length) {
            setSelectedPurchaseIds(new Set());
        } else {
            setSelectedPurchaseIds(new Set(filtered.map(p => p.id)));
        }
    };

    const handleBulkDelete = async () => {
        setBulkDeleteConfirmOpen(false);
        try {
            const res = await axios.post('/api/purchases/bulk/delete', { purchaseIds: Array.from(selectedPurchaseIds) });
            setMessage(res.data.message);
            setSelectedPurchaseIds(new Set());
            fetchPurchases();
        } catch (err) {
            setMessage('Error deleting purchases: ' + (err.response?.data?.error ?? err.message));
        }
    };

    const filtered = purchases.filter(p => {
        const q = search.toLowerCase();
        const termYear = p.term && p.academic_year ? `${p.term} ${p.academic_year}` : '';
        return (
            `${p.forename} ${p.surname}`.toLowerCase().includes(q) ||
            p.staffId?.toLowerCase().includes(q) ||
            p.itemName?.toLowerCase().includes(q) ||
            termYear.toLowerCase().includes(q) ||
            new Date(p.timestamp).toLocaleDateString().includes(q)
        );
    });

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="purchases-management">
            <div className="search-bar-container">
                <div className="search-container">
                    <Search size={20} />
                    <input
                        className="search-input"
                        placeholder="Search purchases"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="purchases-list">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={filtered.length > 0 && selectedPurchaseIds.size === filtered.length}
                                    onChange={toggleSelectAll}
                                    style={{ cursor: 'pointer' }}
                                />
                            </th>
                            <th>Date & Time</th>
                            <th>Staff Name</th>
                            <th>Item</th>
                            <th className="col-quantity">Qty</th>
                            <th className="col-price">Total</th>
                            <th>Term</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={8} className="no-results">No purchases found</td></tr>
                        ) : (
                            filtered.map(p => (
                                <tr key={p.id}>
                                    {editingId === p.id ? (
                                        <>
                                            <td style={{ textAlign: 'center' }}></td>
                                            <td>{formatDate(p.timestamp)}</td>
                                            <td>{editStaffName}</td>
                                            <td style={{ position: 'relative' }}>
                                                <input
                                                    className="edit-input"
                                                    value={editItemName}
                                                    onChange={e => handleItemInputChange(e.target.value)}
                                                    onFocus={() => setShowItemDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') saveEdit(p.id);
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                    placeholder="Search items..."
                                                    autoComplete="off"
                                                />
                                                {showItemDropdown && getFilteredItems().length > 0 && (
                                                    <div className="item-dropdown">
                                                        {getFilteredItems().slice(0, 8).map(item => (
                                                            <div
                                                                key={item.id}
                                                                className="item-dropdown-option"
                                                                onMouseDown={() => handleSelectItem(item.name)}
                                                            >
                                                                <span className="item-name">{item.name}</span>
                                                                <span className="item-price">£{item.price.toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="col-quantity">
                                                <input
                                                    className="edit-input"
                                                    type="number"
                                                    value={editQuantity}
                                                    onChange={e => setEditQuantity(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') saveEdit(p.id);
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                />
                                            </td>
                                            <td className="col-price">
                                                <input
                                                    className="edit-input"
                                                    type="number"
                                                    step="0.01"
                                                    value={editTotalPrice}
                                                    onChange={e => setEditTotalPrice(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') saveEdit(p.id);
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                />
                                            </td>
                                            <td>{p.term && p.academic_year ? `${p.term} ${p.academic_year}` : 'N/A'}</td>
                                            <td className="col-actions">
                                                <button onClick={() => saveEdit(p.id)} className="table-button">Save</button>
                                                <button onClick={cancelEdit} className="table-button">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{ textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPurchaseIds.has(p.id)}
                                                    onChange={() => toggleSelectPurchase(p.id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td>{formatDate(p.timestamp)}</td>
                                            <td>{p.forename} {p.surname}</td>
                                            <td>{p.itemName}</td>
                                            <td className="col-quantity">{p.quantity}</td>
                                            <td className="col-price">£{p.totalPrice.toFixed(2)}</td>
                                            <td>{p.term && p.academic_year ? `${p.term} ${p.academic_year}` : 'N/A'}</td>
                                            <td className="col-actions">
                                                <button onClick={() => startEdit(p)} className="table-button">Edit</button>
                                                <button onClick={() => handleDeleteRequest(p)} className="delete-btn table-button">Delete</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedPurchaseIds.size > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#fff3cd', border: '2px solid #ff9800', borderRadius: '8px', marginTop: '0.75rem' }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>{selectedPurchaseIds.size} selected</span>
                    <button 
                        onClick={() => setBulkDeleteConfirmOpen(true)} 
                        className="delete-btn table-button"
                    >
                        Delete ({selectedPurchaseIds.size})
                    </button>
                    <button 
                        onClick={() => setSelectedPurchaseIds(new Set())} 
                        className="table-button"
                        style={{ marginLeft: 'auto' }}
                    >
                        Clear Selection
                    </button>
                </div>
            )}

            {message && <div className="message">{message}</div>}

            <ConfirmModal
                open={confirmOpen}
                title="⚠️ Delete Purchase"
                message={confirmTarget ? `Are you sure you want to permanently delete this purchase (${confirmTarget.itemName} - ${confirmTarget.forename} ${confirmTarget.surname})? This action CANNOT be undone.` : 'Are you sure?'}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
            />

            <ConfirmModal
                open={bulkDeleteConfirmOpen}
                title="⚠️ Permanently Delete Multiple Purchases"
                message={`This will PERMANENTLY delete ${selectedPurchaseIds.size} purchase record(s) from the database. Purchase data will be lost and cannot be recovered. This action CANNOT be undone. Are you absolutely sure?`}
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteConfirmOpen(false)}
            />
        </div>
    );
}
