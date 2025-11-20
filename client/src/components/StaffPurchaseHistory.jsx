import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Receipt, Calendar } from 'lucide-react';
import './StaffPurchaseHistory.css';

function StaffPurchaseHistory({ staff, onBack }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchPurchaseHistory();
    }, [staff.initials]);

    const fetchPurchaseHistory = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/purchases/staff/${staff.initials}`);
            setData(response.data);
        } catch (err) {
            console.error('Error fetching purchase history:', err);
            setError('Failed to load purchase history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price) => {
        return `£${parseFloat(price).toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="purchase-history">
                <div className="loading">Loading purchase history...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="purchase-history">
                <button className="back-button" onClick={onBack}>
                    <ArrowLeft size={20} /> Back
                </button>
                <div className="error-message">{error}</div>
            </div>
        );
    }

    return (
        <div className="purchase-history">
            <div className="history-header">
                <button className="back-button" onClick={onBack}>
                    <ArrowLeft size={20} /> Back to Shopping
                </button>
                <h2>
                    <Receipt size={24} />
                    Purchase History - {staff.forename} {staff.surname}
                </h2>
            </div>

            <div className="purchase-content-scroll">
                {/* Current Term Summary */}
                <div className="current-term-summary">
                    <div className="summary-header">
                        <Calendar size={20} />
                        <h3>{data.currentTerm} {data.currentYear}</h3>
                    </div>
                    <div className="summary-stats">
                        <div className="stat-card">
                            <div className="stat-label">Items Purchased</div>
                            <div className="stat-value">{data.currentTermSummary.itemCount}</div>
                        </div>
                        <div className="stat-card total-spent">
                            <div className="stat-label">Total Spent</div>
                            <div className="stat-value">{formatPrice(data.currentTermSummary.totalSpent)}</div>
                        </div>
                    </div>
                </div>

                {/* Recent Purchases */}
                {data.currentTermPurchases && data.currentTermPurchases.length > 0 ? (
                    <div className="purchases-section">
                        <h3>Recent Purchases</h3>
                        <div className="purchases-list">
                            {data.currentTermPurchases.map((purchase) => (
                                <div key={purchase.id} className="purchase-item">
                                    <div className="purchase-main">
                                        <div className="purchase-name">{purchase.itemName}</div>
                                        <div className="purchase-details">
                                            <span className="purchase-quantity">Qty: {purchase.quantity}</span>
                                            <span className="purchase-price">{formatPrice(purchase.price)} each</span>
                                        </div>
                                    </div>
                                    <div className="purchase-right">
                                        <div className="purchase-total">{formatPrice(purchase.price * purchase.quantity)}</div>
                                        <div className="purchase-date">{formatDate(purchase.timestamp)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="no-purchases">
                        <Receipt size={48} strokeWidth={1.5} />
                        <p>No purchases yet this term</p>
                    </div>
                )}

                {/* Historical Summary */}
                {data.termSummaries && data.termSummaries.length > 0 && (
                    <div className="historical-section">
                        <h3>Previous Terms</h3>
                        <div className="term-summaries">
                            {data.termSummaries
                                .filter(term => !(term.term === data.currentTerm && term.academic_year === data.currentYear))
                                .map((term, idx) => (
                                    <div key={idx} className="term-summary-card">
                                        <div className="term-name">{term.term} {term.academic_year}</div>
                                        <div className="term-stats">
                                            <span>{term.itemCount} items</span>
                                            <span className="term-total">{formatPrice(term.totalSpent)}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StaffPurchaseHistory;
