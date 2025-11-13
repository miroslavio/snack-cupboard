import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Download, Settings, FileText } from 'lucide-react';
import StaffManagement from './admin/StaffManagement';
import ItemsManagement from './admin/ItemsManagement';
import PurchasesManagement from './admin/PurchasesManagement';
import PurchasesExport from './admin/PurchasesExport';
import './AdminPanel.css';

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState('staff');

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h2>Admin Panel</h2>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                    onClick={() => setActiveTab('staff')}
                >
                    <Upload size={18} />
                    Manage Staff
                </button>
                <button
                    className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                    onClick={() => setActiveTab('items')}
                >
                    <Settings size={18} />
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
                {activeTab === 'staff' && <StaffManagement />}
                {activeTab === 'items' && <ItemsManagement />}
                {activeTab === 'purchases' && <PurchasesManagement />}
                {activeTab === 'export' && <PurchasesExport />}
            </div>
        </div>
    );
}
