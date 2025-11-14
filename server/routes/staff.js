import express from 'express';
import csvParser from 'csv-parser';
import { allAsync, runAsync, getAsync } from '../database.js';

const router = express.Router();

// Get all staff (sorted alphabetically, exclude archived)
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        const includeArchived = req.query.includeArchived === 'true';

        let query = 'SELECT * FROM staff';
        const params = [];
        const conditions = [];

        if (!includeArchived) {
            conditions.push('archived_at IS NULL');
        }

        if (search) {
            conditions.push('(forename LIKE ? OR surname LIKE ? OR initials LIKE ? OR staffId LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY surname ASC, forename ASC';

        const staff = await allAsync(query, params);
        res.json(staff);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Import staff from CSV (upsert based on staffId)
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

        // Process staff (upsert: update if exists, insert if new)
        let imported = 0;
        let updated = 0;
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim());
            if (parts.length > Math.max(staffIdIdx, initialsIdx, surnameIdx, forenameIdx)) {
                try {
                    const staffId = parts[staffIdIdx];
                    const initials = parts[initialsIdx];
                    const surname = parts[surnameIdx];
                    const forename = parts[forenameIdx];

                    // Check if staff exists
                    const existing = await getAsync('SELECT id FROM staff WHERE staffId = ?', [staffId]);

                    if (existing) {
                        // Update existing staff and unarchive if archived
                        await runAsync(
                            'UPDATE staff SET initials = ?, surname = ?, forename = ?, archived_at = NULL WHERE staffId = ?',
                            [initials, surname, forename, staffId]
                        );
                        updated++;
                    } else {
                        // Insert new staff
                        await runAsync(
                            'INSERT INTO staff (staffId, initials, surname, forename) VALUES (?, ?, ?, ?)',
                            [staffId, initials, surname, forename]
                        );
                        imported++;
                    }
                } catch (err) {
                    console.error('Error processing row:', err);
                    if (!err.message.includes('UNIQUE')) throw err;
                }
            }
        }

        res.json({ message: `Imported ${imported} new staff members, updated ${updated} existing records` });
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

        // Check for archived staff with same staffId
        const archived = await getAsync(
            'SELECT id FROM staff WHERE staffId = ? AND archived_at IS NOT NULL',
            [staffId]
        );

        if (archived) {
            // Restore and update the archived staff member
            await runAsync(
                'UPDATE staff SET archived_at = NULL, initials = ?, surname = ?, forename = ? WHERE staffId = ?',
                [initials, surname, forename, staffId]
            );
            return res.json({ message: 'Staff member restored and updated' });
        }

        // Check for active staff with same staffId
        const existing = await getAsync(
            'SELECT id FROM staff WHERE staffId = ? AND archived_at IS NULL',
            [staffId]
        );

        if (existing) {
            return res.status(400).json({ error: 'StaffID already exists' });
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

// Archive a staff member by staffId (soft delete)
router.delete('/:staffId', async (req, res) => {
    try {
        const { staffId } = req.params;
        await runAsync('UPDATE staff SET archived_at = CURRENT_TIMESTAMP WHERE staffId = ?', [staffId]);
        res.json({ message: 'Staff member archived' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Restore archived staff member
router.put('/:staffId/restore', async (req, res) => {
    try {
        const { staffId } = req.params;
        await runAsync('UPDATE staff SET archived_at = NULL WHERE staffId = ?', [staffId]);
        res.json({ message: 'Staff member restored' });
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
