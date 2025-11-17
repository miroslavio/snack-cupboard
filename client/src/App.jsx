import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import UserSelection from './components/UserSelection';
import ItemSelection from './components/ItemSelection';
import Basket from './components/Basket';
import AdminPanel from './components/AdminPanel';
import PasswordModal from './components/PasswordModal';
import ConfirmCheckoutModal from './components/ConfirmCheckoutModal';
import { Settings, Home } from 'lucide-react';


function App() {
    const [currentPage, setCurrentPage] = useState('user-selection');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [basket, setBasket] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [currentTerm, setCurrentTerm] = useState('');
    const [currentYear, setCurrentYear] = useState('');

    useEffect(() => {
        fetchCurrentTerm();
    }, []);

    const fetchCurrentTerm = async () => {
        try {
            const response = await axios.get('/api/settings/current');
            setCurrentTerm(response.data.term);
            setCurrentYear(response.data.academic_year);
        } catch (err) {
            console.error('Error fetching current term:', err);
        }
    };

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

    // Show modal instead of direct checkout
    const handleCheckout = () => {
        if (!selectedStaff || basket.length === 0) return;
        setShowCheckoutModal(true);
        setCheckoutError('');
        setCheckoutSuccess(false);
    };

    // Called when user confirms in modal
    const handleConfirmCheckout = async () => {
        setCheckoutLoading(true);
        setCheckoutError('');
        try {
            await axios.post('/api/purchases', {
                staffInitials: selectedStaff.initials,
                items: basket
            });
            setCheckoutLoading(false);
            setCheckoutSuccess(true);

            // Wait 1.5s to show success message, then close and reset
            setTimeout(() => {
                setBasket([]);
                setSelectedStaff(null);
                setCurrentPage('user-selection');
                setShowCheckoutModal(false);
                setCheckoutSuccess(false);
            }, 1500);
        } catch (err) {
            setCheckoutError('Error recording purchase: ' + (err.response?.data?.error ?? err.message));
            setCheckoutLoading(false);
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
            return true;
        } else {
            return false;
        }
    };

    const handleHomeClick = () => {
        setIsAuthenticated(false);
        setSelectedStaff(null);
        setBasket([]);
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

    const total = basket.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="App">
            <header className="header">
                <div className="header-content">
                    <h1 onClick={handleHomeClick} style={{ cursor: 'pointer' }} title="Return to Home">🥨 Snack Cupboard</h1>
                    <div className="header-right">
                        {currentTerm && currentYear && currentPage !== 'admin' && (
                            <span className="header-term-badge">{currentTerm} {currentYear}</span>
                        )}
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
                        <AdminPanel onTermChange={fetchCurrentTerm} />
                    )}
                </main>
            </div>

            <PasswordModal
                open={showPasswordModal}
                onSubmit={handlePasswordSubmit}
                onCancel={() => setShowPasswordModal(false)}
            />

            <ConfirmCheckoutModal
                open={showCheckoutModal}
                staff={selectedStaff}
                items={basket}
                total={total}
                loading={checkoutLoading}
                success={checkoutSuccess}
                error={checkoutError}
                onConfirm={handleConfirmCheckout}
                onCancel={() => setShowCheckoutModal(false)}
            />
            {/* Optionally show error in modal if needed */}
            {/* {checkoutError && <div className="message" style={{ color: 'red' }}>{checkoutError}</div>} */}
        </div>
    );
}

export default App;
