import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

    const filtered = purchases.filter(p => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            p.forename?.toLowerCase().includes(q) ||
            p.surname?.toLowerCase().includes(q) ||
            `${p.forename} ${p.surname}`.toLowerCase().includes(q) ||
            p.itemName?.toLowerCase().includes(q) ||
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
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        className="search-input"
                        placeholder="Search purchases..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="purchases-list">
                <table>
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Staff Name</th>
                            <th>Item</th>
                            <th className="col-quantity">Qty</th>
                            <th className="col-price">Total</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="no-results">No purchases found</td></tr>
                        ) : (
                            filtered.map(p => (
                                <tr key={p.id}>
                                    {editingId === p.id ? (
                                        <>
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
                                            <td className="col-actions">
                                                <button onClick={() => saveEdit(p.id)} className="table-button">Save</button>
                                                <button onClick={cancelEdit} className="table-button">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{formatDate(p.timestamp)}</td>
                                            <td>{p.forename} {p.surname}</td>
                                            <td>{p.itemName}</td>
                                            <td className="col-quantity">{p.quantity}</td>
                                            <td className="col-price">£{p.totalPrice.toFixed(2)}</td>
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

            {message && <div className="message">{message}</div>}

            <ConfirmModal
                open={confirmOpen}
                title="Delete purchase"
                message={confirmTarget ? `Are you sure you want to delete this purchase (${confirmTarget.itemName} - ${confirmTarget.forename} ${confirmTarget.surname})?` : 'Are you sure?'}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
            />
        </div>
    );
}
