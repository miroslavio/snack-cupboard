import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import './UserSelection.css';

export default function UserSelection({ onSelectStaff }) {
    const [staff, setStaff] = useState([]);
    const [search, setSearch] = useState('');
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/staff');
            setStaff(response.data);
            setFilteredStaff(response.data);
        } catch (err) {
            console.error('Error fetching staff:', err);
            alert('Error loading staff list');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearch(value);
        if (!value.trim()) {
            setFilteredStaff(staff);
        } else {
            const lowercaseSearch = value.toLowerCase();
            setFilteredStaff(
                staff.filter(s =>
                    `${s.forename} ${s.surname}`.toLowerCase().includes(lowercaseSearch) ||
                    s.initials.toLowerCase().includes(lowercaseSearch) ||
                    s.staffId.includes(value)
                )
            );
        }
    };

    return (
        <div className="user-selection">
            <div className="selection-title">
                <h2>Select Your Name</h2>
                <p>Alphabetically sorted list of staff members</p>
            </div>

            <div className="search-container">
                <Search size={20} />
                <input
                    type="text"
                    placeholder="Search by name or initials"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input"
                />
            </div>

            {loading ? (
                <div className="loading">Loading staff list...</div>
            ) : filteredStaff.length === 0 ? (
                <div className="no-results">
                    {staff.length === 0 ? 'No staff members loaded. Please ask admin to import staff list.' : 'No matching staff members found'}
                </div>
            ) : (
                <div className="staff-grid">
                    {filteredStaff.map((member) => (
                        <button
                            key={member.id}
                            className="staff-card"
                            onClick={() => onSelectStaff(member)}
                        >
                            <div className="staff-card-content">
                                <div className="staff-name">
                                    {member.forename} {member.surname}
                                </div>
                                <div className="staff-info">
                                    <span className="initials">{member.initials}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
