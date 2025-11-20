import express from 'express';
import { allAsync, runAsync, getAsync } from '../database.js';

const router = express.Router();

// Verify admin password
router.post('/verify-password', async (req, res) => {
    try {
        const { password } = req.body;

        // Simple password check - matches App.jsx authentication
        if (password === 'admin123') {
            res.json({ valid: true });
        } else {
            res.json({ valid: false });
        }
    } catch (error) {
        console.error('Password verification error:', error);
        res.status(500).json({ error: 'Failed to verify password' });
    }
});

// Get reset statistics (what will be deleted)
router.get('/statistics', async (req, res) => {
    try {
        const stats = {
            purchases: await getAsync('SELECT COUNT(*) as count FROM purchases'),
            staff: await getAsync('SELECT COUNT(*) as count FROM staff WHERE archived_at IS NULL'),
            archivedStaff: await getAsync('SELECT COUNT(*) as count FROM staff WHERE archived_at IS NOT NULL'),
            items: await getAsync('SELECT COUNT(*) as count FROM items WHERE archived_at IS NULL'),
            archivedItems: await getAsync('SELECT COUNT(*) as count FROM items WHERE archived_at IS NOT NULL'),
            terms: await getAsync('SELECT COUNT(*) as count FROM terms')
        };

        res.json({
            purchases: stats.purchases.count,
            staff: stats.staff.count,
            archivedStaff: stats.archivedStaff.count,
            items: stats.items.count,
            archivedItems: stats.archivedItems.count,
            terms: stats.terms.count,
            total: stats.purchases.count + stats.staff.count + stats.archivedStaff.count +
                stats.items.count + stats.archivedItems.count + stats.terms.count
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Export all data before reset
router.get('/export-backup', async (req, res) => {
    try {
        const [purchases, staff, items, terms, settings] = await Promise.all([
            allAsync('SELECT * FROM purchases'),
            allAsync('SELECT * FROM staff'),
            allAsync('SELECT * FROM items'),
            allAsync('SELECT * FROM terms'),
            allAsync('SELECT * FROM settings') // Export all settings
        ]);

        const backup = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: {
                purchases,
                staff,
                items,
                terms,
                settings
            }
        };

        res.json(backup);
    } catch (error) {
        console.error('Backup export error:', error);
        res.status(500).json({ error: 'Failed to export backup' });
    }
});

// Perform the reset
router.post('/execute', async (req, res) => {
    try {
        const { password, confirmationPhrase } = req.body;

        // Verify password
        if (password !== 'admin123') {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Verify confirmation phrase
        if (confirmationPhrase !== 'DELETE') {
            return res.status(400).json({ error: 'Invalid confirmation phrase' });
        }

        // Begin transaction
        await runAsync('BEGIN TRANSACTION');

        try {
            // Delete all data
            await runAsync('DELETE FROM purchases');
            await runAsync('DELETE FROM staff');
            await runAsync('DELETE FROM items');
            await runAsync('DELETE FROM terms');

            // Reset settings to defaults (keep currency if it exists)
            await runAsync(`DELETE FROM settings WHERE key != 'currency'`);

            // Insert default term
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // Determine current term based on month
            let termName, academicYear;
            if (month >= 8 && month <= 11) { // Sept-Dec
                termName = 'Michaelmas';
                academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
            } else if (month >= 0 && month <= 2) { // Jan-Mar
                termName = 'Hilary';
                academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
            } else { // Apr-Aug
                termName = 'Trinity';
                academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
            }

            await runAsync(
                'INSERT INTO terms (term, academic_year) VALUES (?, ?)',
                [termName, academicYear]
            );

            // Update settings with new current term
            await runAsync(
                'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
                ['current_term', termName]
            );
            await runAsync(
                'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
                ['current_academic_year', academicYear]
            );

            // Commit transaction
            await runAsync('COMMIT');

            res.json({
                success: true,
                message: 'Database reset successfully',
                newTerm: { term: termName, academic_year: academicYear }
            });
        } catch (error) {
            // Rollback on error
            await runAsync('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Reset execution error:', error);
        res.status(500).json({ error: 'Failed to reset database' });
    }
});

export default router;
