import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Users, Package, Calendar } from 'lucide-react';
import './Analytics.css';

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [terms, setTerms] = useState([]);
    const [selectedTerm, setSelectedTerm] = useState('all');
    const [selectedYear, setSelectedYear] = useState('all');

    // Analytics data
    const [popularItems, setPopularItems] = useState([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState([]);
    const [staffSpending, setStaffSpending] = useState({ staffSpending: [], summary: {} });
    const [timeTrends, setTimeTrends] = useState([]);
    const [activeView, setActiveView] = useState('popular');

    useEffect(() => {
        fetchTerms();
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [selectedTerm, selectedYear]);

    const fetchTerms = async () => {
        try {
            const response = await axios.get('/api/settings/all-terms');
            setTerms(response.data);
        } catch (err) {
            console.error('Failed to fetch terms:', err);
        }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedTerm !== 'all') params.term = selectedTerm;
            if (selectedYear !== 'all') params.academic_year = selectedYear;

            const [popular, category, staff, trends] = await Promise.all([
                axios.get('/api/purchases/analytics/popular-items', { params }),
                axios.get('/api/purchases/analytics/category-breakdown', { params }),
                axios.get('/api/purchases/analytics/staff-spending', { params }),
                axios.get('/api/purchases/analytics/time-trends', { params })
            ]);

            setPopularItems(popular.data);
            setCategoryBreakdown(category.data);
            setStaffSpending(staff.data);
            setTimeTrends(trends.data);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => `£${value.toFixed(2)}`;

    const renderPopularItems = () => (
        <div className="analytics-section">
            <div className="section-header">
                <Package size={20} />
                <h3>Popular Items</h3>
            </div>
            {popularItems.length === 0 ? (
                <p className="no-data">No data available for the selected period</p>
            ) : (
                <div className="table-container">
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Item</th>
                                    <th>Category</th>
                                    <th>Purchases</th>
                                    <th>Quantity</th>
                                    <th>Revenue</th>
                                    <th>Avg Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {popularItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="rank-cell">{idx + 1}</td>
                                        <td className="item-name-cell">{item.itemName}</td>
                                        <td>
                                            <span className={`category-badge ${item.category?.toLowerCase()}`}>
                                                {item.category || 'Unknown'}
                                            </span>
                                        </td>
                                        <td>{item.purchaseCount}</td>
                                        <td>{item.totalQuantity}</td>
                                        <td className="revenue-cell">{formatCurrency(item.totalRevenue)}</td>
                                        <td>{formatCurrency(item.avgPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCategoryBreakdown = () => (
        <div className="analytics-section">
            <div className="section-header">
                <TrendingUp size={20} />
                <h3>Category Breakdown</h3>
            </div>
            {categoryBreakdown.length === 0 ? (
                <p className="no-data">No data available for the selected period</p>
            ) : (
                <div className="category-cards">
                    {categoryBreakdown.map((cat, idx) => (
                        <div key={idx} className="category-card">
                            <div className="category-header">
                                <h4>{cat.category}</h4>
                                <span className="percentage">{cat.percentage}%</span>
                            </div>
                            <div className="category-stats">
                                <div className="stat">
                                    <span className="stat-label">Revenue</span>
                                    <span className="stat-value">{formatCurrency(cat.totalRevenue)}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Purchases</span>
                                    <span className="stat-value">{cat.purchaseCount}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Quantity</span>
                                    <span className="stat-value">{cat.totalQuantity}</span>
                                </div>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${cat.category?.toLowerCase()}`}
                                    style={{ width: `${cat.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderStaffSpending = () => (
        <div className="analytics-section">
            <div className="section-header">
                <Users size={20} />
                <h3>Staff Spending Trends</h3>
            </div>
            {staffSpending.staffSpending.length === 0 ? (
                <p className="no-data">No data available for the selected period</p>
            ) : (
                <>
                    <div className="summary-cards">
                        <div className="summary-card">
                            <span className="summary-label">Total Staff</span>
                            <span className="summary-value">{staffSpending.summary.totalStaffWithPurchases}</span>
                        </div>
                        <div className="summary-card">
                            <span className="summary-label">Total Spent</span>
                            <span className="summary-value">{formatCurrency(staffSpending.summary.totalSpent)}</span>
                        </div>
                        <div className="summary-card">
                            <span className="summary-label">Average per Staff</span>
                            <span className="summary-value">{formatCurrency(staffSpending.summary.avgSpentPerStaff)}</span>
                        </div>
                    </div>
                    <div className="table-container">
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Staff</th>
                                        <th>Purchases</th>
                                        <th>Total Items</th>
                                        <th>Total Spent</th>
                                        <th>Avg Purchase</th>
                                        <th>Period</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffSpending.staffSpending.map((staff, idx) => (
                                        <tr key={staff.initials}>
                                            <td className="rank-cell">{idx + 1}</td>
                                            <td className="staff-name-cell">
                                                <div>{staff.forename} {staff.surname}</div>
                                                <div className="staff-initials">{staff.initials}</div>
                                            </td>
                                            <td>{staff.purchaseCount}</td>
                                            <td>{staff.totalItems}</td>
                                            <td className="revenue-cell">{formatCurrency(staff.totalSpent)}</td>
                                            <td>{formatCurrency(staff.avgPurchaseValue)}</td>
                                            <td className="period-cell">
                                                {staff.firstPurchase === staff.lastPurchase
                                                    ? staff.firstPurchase
                                                    : `${staff.firstPurchase} to ${staff.lastPurchase}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    const renderTimeTrends = () => (
        <div className="analytics-section">
            <div className="section-header">
                <Calendar size={20} />
                <h3>Time-Based Trends</h3>
            </div>
            {timeTrends.length === 0 ? (
                <p className="no-data">No data available for the selected period</p>
            ) : (
                <div className="table-container">
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Purchases</th>
                                    <th>Items Sold</th>
                                    <th>Revenue</th>
                                    <th>Unique Staff</th>
                                    <th>Avg per Purchase</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timeTrends.map((trend, idx) => (
                                    <tr key={idx}>
                                        <td className="date-cell">{trend.date || trend.period}</td>
                                        <td>{trend.purchaseCount}</td>
                                        <td>{trend.totalItems}</td>
                                        <td className="revenue-cell">{formatCurrency(trend.totalRevenue)}</td>
                                        <td>{trend.uniqueStaff}</td>
                                        <td>{formatCurrency(trend.totalRevenue / trend.purchaseCount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="analytics-container">
            <div className="analytics-filters">
                <div className="filter-group">
                    <label>Term:</label>
                    <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
                        <option value="all">All Terms</option>
                        <option value="Michaelmas">Michaelmas</option>
                        <option value="Hilary">Hilary</option>
                        <option value="Trinity">Trinity</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Academic Year:</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="all">All Years</option>
                        {[...new Set(terms.map(t => t.academic_year))].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="analytics-tabs">
                <button
                    className={`analytics-tab ${activeView === 'popular' ? 'active' : ''}`}
                    onClick={() => setActiveView('popular')}
                >
                    <Package size={16} />
                    Popular Items
                </button>
                <button
                    className={`analytics-tab ${activeView === 'category' ? 'active' : ''}`}
                    onClick={() => setActiveView('category')}
                >
                    <TrendingUp size={16} />
                    Categories
                </button>
                <button
                    className={`analytics-tab ${activeView === 'staff' ? 'active' : ''}`}
                    onClick={() => setActiveView('staff')}
                >
                    <Users size={16} />
                    Staff Spending
                </button>
                <button
                    className={`analytics-tab ${activeView === 'trends' ? 'active' : ''}`}
                    onClick={() => setActiveView('trends')}
                >
                    <Calendar size={16} />
                    Time Trends
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading analytics...</div>
            ) : (
                <div className="analytics-content">
                    {activeView === 'popular' && renderPopularItems()}
                    {activeView === 'category' && renderCategoryBreakdown()}
                    {activeView === 'staff' && renderStaffSpending()}
                    {activeView === 'trends' && renderTimeTrends()}
                </div>
            )}
        </div>
    );
}
