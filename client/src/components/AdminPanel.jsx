import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { Users, Cookie, Download, FileText, Calendar, AlertTriangle, Menu, X, BarChart3 } from 'lucide-react';
import StaffManagement from './admin/StaffManagement';
import ItemsManagement from './admin/ItemsManagement';
import PurchasesManagement from './admin/PurchasesManagement';
import PurchasesExport from './admin/PurchasesExport';
import TermSettings from './admin/TermSettings';
import Analytics from './admin/Analytics';
import DangerZone from './admin/DangerZone';
import './AdminPanel.css';

export default function AdminPanel({ onTermChange }) {
    const [activeTab, setActiveTab] = useState('term');
    const [menuOpen, setMenuOpen] = useState(false);

    const currentTitle = useMemo(() => {
        switch (activeTab) {
            case 'term':
                return { icon: <Calendar size={24} />, text: 'Term Settings', color: null };
            case 'staff':
                return { icon: <Users size={24} />, text: 'Manage Staff', color: null };
            case 'items':
                return { icon: <Cookie size={24} />, text: 'Manage Items', color: null };
            case 'purchases':
                return { icon: <FileText size={24} />, text: 'Manage Purchases', color: null };
            case 'analytics':
                return { icon: <BarChart3 size={24} />, text: 'Analytics Dashboard', color: null };
            case 'export':
                return { icon: <Download size={24} />, text: 'Export Purchases', color: null };
            case 'danger':
                return { icon: <AlertTriangle size={24} color="#ff6b6b" />, text: 'Danger Zone', color: '#ff6b6b' };
            default:
                return { icon: null, text: '', color: null };
        }
    }, [activeTab]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setMenuOpen(false);
    };

    return (
        <div className="admin-panel">
            {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}
            <div className="admin-header">
                <button
                    className="burger-menu-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className={`admin-tabs ${menuOpen ? 'menu-open' : ''}`}>
                    <button
                        className={`tab-btn ${activeTab === 'term' ? 'active' : ''}`}
                        onClick={() => handleTabClick('term')}
                    >
                        <Calendar size={18} />
                        Term Settings
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                        onClick={() => handleTabClick('staff')}
                    >
                        <Users size={18} />
                        Manage Staff
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                        onClick={() => handleTabClick('items')}
                    >
                        <Cookie size={18} />
                        Manage Items
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
                        onClick={() => handleTabClick('purchases')}
                    >
                        <FileText size={18} />
                        Manage Purchases
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => handleTabClick('analytics')}
                    >
                        <BarChart3 size={18} />
                        Analytics
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
                        onClick={() => handleTabClick('export')}
                    >
                        <Download size={18} />
                        Export Purchases
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'danger' ? 'active' : ''}`}
                        onClick={() => handleTabClick('danger')}
                    >
                        <AlertTriangle size={18} />
                        Danger Zone
                    </button>
                </div>
            </div>

            <div className="admin-content">
                <div className="admin-section-header">
                    <h2 className="admin-section-title" style={currentTitle.color ? { color: currentTitle.color } : {}}>
                        {currentTitle.icon}
                        {currentTitle.text}
                    </h2>
                </div>
                {activeTab === 'term' && <TermSettings onTermChange={onTermChange} />}
                {activeTab === 'staff' && <StaffManagement />}
                {activeTab === 'items' && <ItemsManagement />}
                {activeTab === 'purchases' && <PurchasesManagement />}
                {activeTab === 'analytics' && <Analytics />}
                {activeTab === 'export' && <PurchasesExport />}
                {activeTab === 'danger' && <DangerZone />}
            </div>
        </div>
    );
}
