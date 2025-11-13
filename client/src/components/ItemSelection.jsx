import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import './ItemSelection.css';

export default function ItemSelection({ onAddToBasket }) {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
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

    const applyFilters = (searchValue, category) => {
        let filtered = items;

        // Apply category filter
        if (category !== 'All') {
            filtered = filtered.filter(item => (item.category || 'Food') === category);
        }

        // Apply search filter
        if (searchValue.trim()) {
            const lowercaseSearch = searchValue.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(lowercaseSearch)
            );
        }

        setFilteredItems(filtered);
    };

    const handleSearch = (value) => {
        setSearch(value);
        applyFilters(value, categoryFilter);
    };

    const handleCategoryChange = (category) => {
        setCategoryFilter(category);
        applyFilters(search, category);
    };

    return (
        <div className="item-selection">
            <div className="filters-container">
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

                <div className="category-filter">
                    <button
                        className={`category-btn ${categoryFilter === 'All' ? 'active' : ''}`}
                        onClick={() => handleCategoryChange('All')}
                    >
                        All
                    </button>
                    <button
                        className={`category-btn ${categoryFilter === 'Food' ? 'active' : ''}`}
                        onClick={() => handleCategoryChange('Food')}
                    >
                        🍔 Food
                    </button>
                    <button
                        className={`category-btn ${categoryFilter === 'Drink' ? 'active' : ''}`}
                        onClick={() => handleCategoryChange('Drink')}
                    >
                        🥤 Drink
                    </button>
                </div>
            </div>

            <div className="items-scroll-container">
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
        </div>
    );
}
