import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import UserSelection from './components/UserSelection';
import ItemSelection from './components/ItemSelection';
import Basket from './components/Basket';
import AdminPanel from './components/AdminPanel';
import { Menu, X } from 'lucide-react';

function App() {
    const [currentPage, setCurrentPage] = useState('user-selection');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [basket, setBasket] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleSelectStaff = (staff) => {
        setSelectedStaff(staff);
        setBasket([]);
        setCurrentPage('item-selection');
        setShowMenu(false);
    };

    const handleAddToBasket = (item) => {
        const existingItem = basket.find(b => b.id === item.id);
        if (existingItem) {
            setBasket(basket.map(b =>
                b.id === item.id ? { ...b, quantity: b.quantity + 1 } : b
            ));
        } else {
            setBasket([...basket, { ...item, quantity: 1 }]);
        }
    };

    const handleRemoveFromBasket = (itemId) => {
        const item = basket.find(b => b.id === itemId);
        if (item.quantity > 1) {
            setBasket(basket.map(b =>
                b.id === itemId ? { ...b, quantity: b.quantity - 1 } : b
            ));
        } else {
            setBasket(basket.filter(b => b.id !== itemId));
        }
    };

    const handleCheckout = async () => {
        if (!selectedStaff || basket.length === 0) return;

        try {
            await axios.post('/api/purchases', {
                staffId: selectedStaff.staffId,
                items: basket
            });

            setBasket([]);
            setSelectedStaff(null);
            setCurrentPage('user-selection');
            alert('Purchase recorded successfully!');
        } catch (err) {
            alert('Error recording purchase: ' + err.message);
        }
    };

    const handleBack = () => {
        if (currentPage === 'item-selection') {
            setBasket([]);
            setSelectedStaff(null);
            setCurrentPage('user-selection');
        } else if (currentPage === 'admin') {
            setCurrentPage('user-selection');
        }
        setShowMenu(false);
    };

    return (
        <div className="App">
            <header className="header">
                <div className="header-content">
                    <h1>🥨 Snack Cupboard</h1>
                    <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>
                        {showMenu ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
                {showMenu && (
                    <nav className="mobile-menu">
                        <button onClick={() => { setCurrentPage('user-selection'); setShowMenu(false); }}>
                            User Portal
                        </button>
                        <button onClick={() => { setCurrentPage('admin'); setShowMenu(false); }}>
                            Admin Panel
                        </button>
                    </nav>
                )}
            </header>

            <div className="container">
                <nav className="sidebar">
                    <button
                        className={currentPage === 'user-selection' ? 'active' : ''}
                        onClick={() => { setCurrentPage('user-selection'); setBasket([]); setSelectedStaff(null); }}
                    >
                        User Portal
                    </button>
                    <button
                        className={currentPage === 'admin' ? 'active' : ''}
                        onClick={() => setCurrentPage('admin')}
                    >
                        Admin Panel
                    </button>
                </nav>

                <main className="main-content">
                    {currentPage === 'user-selection' && !selectedStaff && (
                        <UserSelection onSelectStaff={handleSelectStaff} />
                    )}

                    {currentPage === 'item-selection' && selectedStaff && (
                        <div className="item-selection-container">
                            <div className="selection-header">
                                <h2>Welcome, {selectedStaff.forename} {selectedStaff.surname}</h2>
                                <button className="back-btn" onClick={handleBack}>Back</button>
                            </div>
                            <div className="item-basket-layout">
                                <ItemSelection onAddToBasket={handleAddToBasket} />
                                <Basket
                                    items={basket}
                                    onRemoveItem={handleRemoveFromBasket}
                                    onCheckout={handleCheckout}
                                    staffName={selectedStaff.forename}
                                />
                            </div>
                        </div>
                    )}

                    {currentPage === 'admin' && (
                        <AdminPanel onBack={handleBack} />
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
