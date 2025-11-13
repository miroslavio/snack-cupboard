import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import UserSelection from './components/UserSelection';
import ItemSelection from './components/ItemSelection';
import Basket from './components/Basket';
import AdminPanel from './components/AdminPanel';
import PasswordModal from './components/PasswordModal';
import { Settings, Home } from 'lucide-react';

function App() {
    const [currentPage, setCurrentPage] = useState('user-selection');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [basket, setBasket] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const handleSelectStaff = (staff) => {
        setSelectedStaff(staff);
        setBasket([]);
        setCurrentPage('item-selection');
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

    const handleAdminAccess = () => {
        setShowPasswordModal(true);
    };

    const handlePasswordSubmit = (password) => {
        // Simple password check - in production, use proper authentication
        if (password === 'admin123') {
            setIsAuthenticated(true);
            setCurrentPage('admin');
            setShowPasswordModal(false);
        } else {
            alert('Incorrect password');
        }
    };

    const handleHomeClick = () => {
        setIsAuthenticated(false);
        setCurrentPage('user-selection');
    };

    const handleBack = () => {
        if (currentPage === 'item-selection') {
            setBasket([]);
            setSelectedStaff(null);
            setCurrentPage('user-selection');
        } else if (currentPage === 'admin') {
            setIsAuthenticated(false);
            setCurrentPage('user-selection');
        }
    };

    return (
        <div className="App">
            <header className="header">
                <div className="header-content">
                    <h1>🥨 Snack Cupboard</h1>
                    {currentPage === 'admin' ? (
                        <button
                            className="settings-btn"
                            aria-label="Return home"
                            onClick={handleHomeClick}
                            title="Back to User Portal"
                        >
                            <Home size={22} />
                        </button>
                    ) : (
                        <button
                            className="settings-btn"
                            aria-label="Admin settings"
                            onClick={handleAdminAccess}
                            title="Admin Panel"
                        >
                            <Settings size={22} />
                        </button>
                    )}
                </div>
            </header>

            <div className="container">
                <main className={`main-content ${currentPage === 'item-selection' ? 'no-scroll' : ''}`}>
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

                    {currentPage === 'admin' && isAuthenticated && (
                        <AdminPanel />
                    )}
                </main>
            </div>

            <PasswordModal
                open={showPasswordModal}
                onSubmit={handlePasswordSubmit}
                onCancel={() => setShowPasswordModal(false)}
            />
        </div>
    );
}

export default App;
