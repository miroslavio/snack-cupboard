import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './App.css';
import UserSelection from './components/UserSelection';
import ItemSelection from './components/ItemSelection';
import Basket from './components/Basket';
import AdminPanel from './components/AdminPanel';
import PasswordModal from './components/PasswordModal';
import ConfirmCheckoutModal from './components/ConfirmCheckoutModal';
import StaffPurchaseHistory from './components/StaffPurchaseHistory';
import InactivityModal from './components/InactivityModal';
import { Settings, Home, Moon, Sun } from 'lucide-react';


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
    const [showInactivityModal, setShowInactivityModal] = useState(false);
    const [inactivityCountdown, setInactivityCountdown] = useState(30);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved === 'true';
    });

    const inactivityTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    const INACTIVITY_TIMEOUT = 4 * 60 * 1000; // 4 minutes
    const WARNING_TIME = 30 * 1000; // 30 seconds warning

    useEffect(() => {
        fetchCurrentTerm();
        setupInactivityTracking();
        return () => {
            clearInactivityTimers();
        };
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        localStorage.setItem('darkMode', isDarkMode);
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    const clearInactivityTimers = () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };

    const resetInactivityTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        setShowInactivityModal(false);
        setInactivityCountdown(30);
        clearInactivityTimers();

        // Set timer for warning (3.5 minutes)
        warningTimerRef.current = setTimeout(() => {
            setShowInactivityModal(true);
            setInactivityCountdown(30);

            // Start countdown
            countdownIntervalRef.current = setInterval(() => {
                setInactivityCountdown(prev => {
                    if (prev <= 1) {
                        handleInactivityTimeout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, INACTIVITY_TIMEOUT - WARNING_TIME);
    }, []);

    const setupInactivityTracking = () => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        const handleActivity = () => {
            resetInactivityTimer();
        };

        events.forEach(event => {
            document.addEventListener(event, handleActivity);
        });

        // Initial timer setup
        resetInactivityTimer();

        // Cleanup function
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
        };
    };

    const handleInactivityTimeout = () => {
        clearInactivityTimers();
        setShowInactivityModal(false);
        handleReturnHome();
    };

    const handleStayActive = () => {
        resetInactivityTimer();
    };

    const handleReturnHome = () => {
        setCurrentPage('user-selection');
        setSelectedStaff(null);
        setBasket([]);
        setIsAdmin(false);
        setIsAuthenticated(false);
    };

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

    const handleViewPurchaseHistory = () => {
        setCurrentPage('purchase-history');
    };

    const handleBackFromHistory = () => {
        setCurrentPage('item-selection');
    };

    const handleBack = () => {
        if (currentPage === 'item-selection') {
            setBasket([]);
            setSelectedStaff(null);
            setCurrentPage('user-selection');
        } else if (currentPage === 'purchase-history') {
            setCurrentPage('item-selection');
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
                    <div className="header-left">
                        <h1 onClick={handleHomeClick} style={{ cursor: 'pointer' }} title="Return to Home">🥨 Snack Cupboard</h1>
                        {currentPage === 'admin' && (
                            <span className="header-context">Admin Panel</span>
                        )}
                    </div>
                    <div className="header-right">
                        {currentTerm && currentYear && (
                            <span className="header-term-badge">{currentTerm} {currentYear}</span>
                        )}
                        <button
                            className="theme-toggle-btn"
                            onClick={toggleDarkMode}
                            aria-label="Toggle dark mode"
                            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
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

                    {currentPage === 'purchase-history' && selectedStaff && (
                        <StaffPurchaseHistory
                            staff={selectedStaff}
                            onBack={handleBackFromHistory}
                        />
                    )}

                    {currentPage === 'item-selection' && selectedStaff && (
                        <div className="item-selection-container">
                            <div className="selection-header">
                                <h2>Welcome, {selectedStaff.forename} {selectedStaff.surname}</h2>
                                <div className="header-actions">
                                    <button className="view-history-btn" onClick={handleViewPurchaseHistory}>My Purchases</button>
                                    <button className="back-btn" onClick={handleBack}>Back</button>
                                </div>
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

            {showInactivityModal && (
                <InactivityModal
                    timeRemaining={inactivityCountdown}
                    onStayActive={handleStayActive}
                />
            )}
            {/* Optionally show error in modal if needed */}
            {/* {checkoutError && <div className="message" style={{ color: 'red' }}>{checkoutError}</div>} */}
        </div>
    );
}

export default App;
