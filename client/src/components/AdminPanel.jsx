import React, { useState } from 'react';
import axios from 'axios';
import { Users, Cookie, Download, FileText, Calendar } from 'lucide-react';
import StaffManagement from './admin/StaffManagement';
import ItemsManagement from './admin/ItemsManagement';
import PurchasesManagement from './admin/PurchasesManagement';
import PurchasesExport from './admin/PurchasesExport';
import TermSettings from './admin/TermSettings';
import './AdminPanel.css';

export default function AdminPanel({ onTermChange }) {
    const [activeTab, setActiveTab] = useState('term');

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h2>Admin Panel</h2>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'term' ? 'active' : ''}`}
                    onClick={() => setActiveTab('term')}
                >
                    <Calendar size={18} />
                    Term Settings
                </button>
                <button
                    className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                    onClick={() => setActiveTab('staff')}
                >
                    <Users size={18} />
                    Manage Staff
                </button>
                <button
                    className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                    onClick={() => setActiveTab('items')}
                >
                    <Cookie size={18} />
                    Manage Items
                </button>
                <button
                    className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
                    onClick={() => setActiveTab('purchases')}
                >
                    <FileText size={18} />
                    Manage Purchases
                </button>
                <button
                    className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
                    onClick={() => setActiveTab('export')}
                >
                    <Download size={18} />
                    Export Purchases
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'term' && <TermSettings onTermChange={onTermChange} />}
                {activeTab === 'staff' && <StaffManagement />}
                {activeTab === 'items' && <ItemsManagement />}
                {activeTab === 'purchases' && <PurchasesManagement />}
                {activeTab === 'export' && <PurchasesExport />}
            </div>
        </div>
    );
}
