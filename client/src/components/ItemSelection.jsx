import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import './ItemSelection.css';

export default function ItemSelection({ onAddToBasket }) {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/items');
            setItems(response.data);
            setFilteredItems(response.data);
        } catch (err) {
            console.error('Error fetching items:', err);
            alert('Error loading items');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearch(value);
        if (!value.trim()) {
            setFilteredItems(items);
        } else {
            const lowercaseSearch = value.toLowerCase();
            setFilteredItems(
                items.filter(item =>
                    item.name.toLowerCase().includes(lowercaseSearch)
                )
            );
        }
    };

    return (
        <div className="item-selection">
            <div className="items-header">
                <h2>Select Items</h2>
                <div className="search-container">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading items...</div>
            ) : filteredItems.length === 0 ? (
                <div className="no-results">
                    {items.length === 0 ? 'No items available. Please ask admin to add items.' : 'No matching items found'}
                </div>
            ) : (
                <div className="items-list">
                    {filteredItems.map((item) => (
                        <button
                            key={item.id}
                            className="item-card"
                            onClick={() => onAddToBasket(item)}
                        >
                            <div className="item-card-content">
                                <div className="item-name">{item.name}</div>
                                <div className="item-price">£{item.price.toFixed(2)}</div>
                            </div>
                            <div className="item-action">+</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
