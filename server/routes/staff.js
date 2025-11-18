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
            conditions.push('(forename LIKE ? OR surname LIKE ? OR initials LIKE ?)');
            const searchTerm = `%${search}%`;
            const searchTermUpper = `%${search.toUpperCase()}%`;
            params.push(searchTerm, searchTerm, searchTermUpper);
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

// Import staff from CSV (upsert based on initials)
// Supports two modes via query param ?mode=replace (default) or ?mode=append
// Replace mode: archives staff not in the CSV; Append mode: leaves existing staff unchanged
router.post('/import', express.text({ type: 'text/csv' }), async (req, res) => {
    try {
        const mode = req.query.mode || 'replace'; // default to replace
        const lines = req.body.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return res.status(400).json({ error: 'CSV must have header and at least one data row' });
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const initialsIdx = headers.indexOf('initials');
        const surnameIdx = headers.indexOf('surname');
        const forenameIdx = headers.indexOf('forename');

        if (initialsIdx === -1 || surnameIdx === -1 || forenameIdx === -1) {
            return res.status(400).json({ error: 'CSV must have columns: Initials, Surname, Forename' });
        }

        // Get current active staff initials (for replace mode)
        const currentStaff = mode === 'replace'
            ? await allAsync('SELECT initials FROM staff WHERE archived_at IS NULL')
            : [];
        const currentInitials = new Set(currentStaff.map(s => s.initials));

        // Process staff (upsert: update if exists, insert if new)
        let imported = 0;
        let updated = 0;
        const importedInitials = new Set();

        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim());
            if (parts.length > Math.max(initialsIdx, surnameIdx, forenameIdx)) {
                try {
                    const initials = parts[initialsIdx].toUpperCase();
                    const surname = parts[surnameIdx];
                    const forename = parts[forenameIdx];

                    importedInitials.add(initials);

                    // Check if staff exists
                    const existing = await getAsync('SELECT id FROM staff WHERE initials = ?', [initials]);

                    if (existing) {
                        // Update existing staff and unarchive if archived
                        await runAsync(
                            'UPDATE staff SET surname = ?, forename = ?, archived_at = NULL WHERE initials = ?',
                            [surname, forename, initials]
                        );
                        updated++;
                    } else {
                        // Insert new staff
                        await runAsync(
                            'INSERT INTO staff (initials, surname, forename) VALUES (?, ?, ?)',
                            [initials, surname, forename]
                        );
                        imported++;
                    }
                } catch (err) {
                    console.error('Error processing row:', err);
                    if (!err.message.includes('UNIQUE')) throw err;
                }
            }
        }

        // In replace mode, archive staff not in the import
        let archived = 0;
        if (mode === 'replace') {
            const missingInitials = [...currentInitials].filter(id => !importedInitials.has(id));
            if (missingInitials.length > 0) {
                const placeholders = missingInitials.map(() => '?').join(',');
                await runAsync(
                    `UPDATE staff SET archived_at = CURRENT_TIMESTAMP WHERE initials IN (${placeholders}) AND archived_at IS NULL`,
                    missingInitials
                );
                archived = missingInitials.length;
            }
        }

        const parts = [`Imported ${imported} new`, `updated ${updated} existing`];
        if (archived > 0) parts.push(`archived ${archived} removed from list`);

        res.json({ message: parts.join(', ') + ' staff member(s)' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Create single staff member
router.post('/', express.json(), async (req, res) => {
    try {
        const { initials: rawInitials, surname, forename } = req.body;
        const initials = rawInitials?.toUpperCase();
        if (!initials || !surname || !forename) {
            return res.status(400).json({ error: 'initials, surname and forename are required' });
        }

        // Check for archived staff with same initials
        const archived = await getAsync(
            'SELECT id FROM staff WHERE initials = ? AND archived_at IS NOT NULL',
            [initials]
        );

        if (archived) {
            // Restore and update the archived staff member
            await runAsync(
                'UPDATE staff SET archived_at = NULL, surname = ?, forename = ? WHERE initials = ?',
                [surname, forename, initials]
            );
            return res.json({ message: 'Staff member restored and updated' });
        }

        // Check for active staff with same initials
        const existing = await getAsync(
            'SELECT id FROM staff WHERE initials = ? AND archived_at IS NULL',
            [initials]
        );

        if (existing) {
            return res.status(400).json({ error: 'Initials already exist' });
        }

        await runAsync(
            'INSERT INTO staff (initials, surname, forename) VALUES (?, ?, ?)',
            [initials, surname, forename]
        );

        res.json({ message: 'Staff member added' });
    } catch (err) {
        console.error(err);
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Initials already exist' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Archive a staff member by initials (soft delete)
router.delete('/:initials', async (req, res) => {
    try {
        const initials = req.params.initials.toUpperCase();
        await runAsync('UPDATE staff SET archived_at = CURRENT_TIMESTAMP WHERE initials = ?', [initials]);
        res.json({ message: 'Staff member archived' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Restore archived staff member
router.put('/:initials/restore', async (req, res) => {
    try {
        const initials = req.params.initials.toUpperCase();
        await runAsync('UPDATE staff SET archived_at = NULL WHERE initials = ?', [initials]);
        res.json({ message: 'Staff member restored' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Hard delete staff member (permanently remove from database)
// Can only delete archived staff to prevent accidental deletion
router.delete('/:initials/permanent', async (req, res) => {
    try {
        const initials = req.params.initials.toUpperCase();

        // Check if staff is archived
        const staff = await getAsync('SELECT archived_at FROM staff WHERE initials = ?', [initials]);
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found' });
        }
        if (!staff.archived_at) {
            return res.status(400).json({ error: 'Can only permanently delete archived staff. Archive first.' });
        }

        // Delete the staff member (purchases will remain with initials reference)
        await runAsync('DELETE FROM staff WHERE initials = ?', [initials]);
        res.json({ message: 'Staff member permanently deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update a staff member (forename, surname) by initials
router.put('/:initials', express.json(), async (req, res) => {
    try {
        const initials = req.params.initials.toUpperCase();
        const { forename, surname } = req.body;
        if (!forename || !surname) {
            return res.status(400).json({ error: 'forename and surname are required' });
        }

        await runAsync(
            'UPDATE staff SET forename = ?, surname = ? WHERE initials = ?',
            [forename, surname, initials]
        );

        res.json({ message: 'Staff member updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Bulk archive staff members
router.post('/bulk/archive', express.json(), async (req, res) => {
    try {
        const { staffInitials: rawStaffInitials } = req.body;
        const staffInitials = rawStaffInitials?.map(i => i.toUpperCase());
        if (!staffInitials || !Array.isArray(staffInitials) || staffInitials.length === 0) {
            return res.status(400).json({ error: 'staffInitials array is required' });
        }

        const placeholders = staffInitials.map(() => '?').join(',');
        await runAsync(
            `UPDATE staff SET archived_at = CURRENT_TIMESTAMP WHERE initials IN (${placeholders}) AND archived_at IS NULL`,
            staffInitials
        );

        res.json({ message: `Archived ${staffInitials.length} staff member(s)` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Bulk restore staff members
router.post('/bulk/restore', express.json(), async (req, res) => {
    try {
        const { staffInitials: rawStaffInitials } = req.body;
        const staffInitials = rawStaffInitials?.map(i => i.toUpperCase());
        if (!staffInitials || !Array.isArray(staffInitials) || staffInitials.length === 0) {
            return res.status(400).json({ error: 'staffInitials array is required' });
        }

        const placeholders = staffInitials.map(() => '?').join(',');
        await runAsync(
            `UPDATE staff SET archived_at = NULL WHERE initials IN (${placeholders})`,
            staffInitials
        );

        res.json({ message: `Restored ${staffInitials.length} staff member(s)` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Bulk hard delete staff members (only archived)
router.post('/bulk/delete-permanent', express.json(), async (req, res) => {
    try {
        const { staffInitials: rawStaffInitials } = req.body;
        const staffInitials = rawStaffInitials?.map(i => i.toUpperCase());
        if (!staffInitials || !Array.isArray(staffInitials) || staffInitials.length === 0) {
            return res.status(400).json({ error: 'staffInitials array is required' });
        }

        // Verify all are archived
        const placeholders = staffInitials.map(() => '?').join(',');
        const staff = await allAsync(
            `SELECT initials, archived_at FROM staff WHERE initials IN (${placeholders})`,
            staffInitials
        );

        const notArchived = staff.filter(s => !s.archived_at);
        if (notArchived.length > 0) {
            return res.status(400).json({
                error: `Cannot permanently delete active staff. Archive first: ${notArchived.map(s => s.initials).join(', ')}`
            });
        }

        await runAsync(
            `DELETE FROM staff WHERE initials IN (${placeholders})`,
            staffInitials
        );

        res.json({ message: `Permanently deleted ${staffInitials.length} staff member(s)` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
