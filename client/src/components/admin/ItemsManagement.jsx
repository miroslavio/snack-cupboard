import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './items.css';

export default function ItemsManagement() {
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [csvText, setCsvText] = useState('');
    const [message, setMessage] = useState('');

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
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" />
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price (£)" />
                <button onClick={handleAdd}>Add Item</button>
            </div>

            <div className="items-list">
                {items.map(it => (
                    <div key={it.id} className="item-row">
                        <div>{it.name}</div>
                        <div>£{it.price.toFixed(2)}</div>
                        <div><button onClick={() => handleDelete(it.id)}>Delete</button></div>
                    </div>
                ))}
            </div>

            <hr />

            <h4>Import Items (CSV)</h4>
            <p>CSV headers: name,price</p>
            <textarea rows={6} value={csvText} onChange={e => setCsvText(e.target.value)} placeholder={`name,price\nChocolate Bar,1.25`}></textarea>
            <div className="items-import-actions">
                <button onClick={handleImport}>Import CSV</button>
            </div>

            {message && <div className="message">{message}</div>}
        </div>
    );
}
