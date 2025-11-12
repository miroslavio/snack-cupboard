import express from 'express';
import csvParser from 'csv-parser';
import { allAsync, runAsync } from '../database.js';

const router = express.Router();

// Get all staff (sorted alphabetically)
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        let query = 'SELECT * FROM staff';
        const params = [];

        if (search) {
            query += ' WHERE forename LIKE ? OR surname LIKE ? OR initials LIKE ? OR staffId LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY surname ASC, forename ASC';

        const staff = await allAsync(query, params);
        res.json(staff);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Import staff from CSV
router.post('/import', express.text({ type: 'text/csv' }), async (req, res) => {
    try {
        const lines = req.body.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return res.status(400).json({ error: 'CSV must have header and at least one data row' });
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const staffIdIdx = headers.indexOf('staffid');
        const initialsIdx = headers.indexOf('initials');
        const surnameIdx = headers.indexOf('surname');
        const forenameIdx = headers.indexOf('forename');

        if (staffIdIdx === -1 || initialsIdx === -1 || surnameIdx === -1 || forenameIdx === -1) {
            return res.status(400).json({ error: 'CSV must have columns: StaffID, Initials, Surname, Forename' });
        }

        // Clear existing staff
        await runAsync('DELETE FROM staff');

        // Insert new staff
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim());
            if (parts.length > Math.max(staffIdIdx, initialsIdx, surnameIdx, forenameIdx)) {
                try {
                    await runAsync(
                        'INSERT INTO staff (staffId, initials, surname, forename) VALUES (?, ?, ?, ?)',
                        [parts[staffIdIdx], parts[initialsIdx], parts[surnameIdx], parts[forenameIdx]]
                    );
                    imported++;
                } catch (err) {
                    // Skip duplicates
                    if (!err.message.includes('UNIQUE')) throw err;
                }
            }
        }

        res.json({ message: `Imported ${imported} staff members` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Create single staff member
router.post('/', express.json(), async (req, res) => {
    try {
        const { staffId, initials, surname, forename } = req.body;
        if (!staffId || !initials || !surname || !forename) {
            return res.status(400).json({ error: 'staffId, initials, surname and forename are required' });
        }

        await runAsync(
            'INSERT INTO staff (staffId, initials, surname, forename) VALUES (?, ?, ?, ?)',
            [staffId, initials, surname, forename]
        );

        res.json({ message: 'Staff member added' });
    } catch (err) {
        console.error(err);
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'StaffID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete a staff member by staffId
router.delete('/:staffId', async (req, res) => {
    try {
        const { staffId } = req.params;
        await runAsync('DELETE FROM staff WHERE staffId = ?', [staffId]);
        res.json({ message: 'Staff member deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update a staff member (initials, forename, surname) by staffId
router.put('/:staffId', express.json(), async (req, res) => {
    try {
        const { staffId } = req.params;
        const { initials, forename, surname } = req.body;
        if (!initials || !forename || !surname) {
            return res.status(400).json({ error: 'initials, forename and surname are required' });
        }

        await runAsync(
            'UPDATE staff SET initials = ?, forename = ?, surname = ? WHERE staffId = ?',
            [initials, forename, surname, staffId]
        );

        res.json({ message: 'Staff member updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
