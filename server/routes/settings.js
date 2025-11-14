import express from 'express';
import { getAsync, runAsync, allAsync } from '../database.js';

const router = express.Router();

// Get current term and academic year
router.get('/current', async (req, res) => {
    try {
        const term = await getAsync('SELECT value FROM settings WHERE key = ?', ['current_term']);
        const year = await getAsync('SELECT value FROM settings WHERE key = ?', ['current_academic_year']);

        res.json({
            term: term?.value || 'Michaelmas',
            academic_year: year?.value || '2024-25'
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update current term and academic year
router.put('/current', async (req, res) => {
    try {
        const { term, academic_year } = req.body;

        if (!term || !academic_year) {
            return res.status(400).json({ error: 'Term and academic year are required' });
        }

        // Validate term
        const validTerms = ['Michaelmas', 'Hilary', 'Trinity'];
        if (!validTerms.includes(term)) {
            return res.status(400).json({ error: 'Invalid term. Must be Michaelmas, Hilary, or Trinity' });
        }

        // Add to terms table if it doesn't exist
        await runAsync(
            'INSERT OR IGNORE INTO terms (term, academic_year) VALUES (?, ?)',
            [term, academic_year]
        );

        // Update settings
        await runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['current_term', term]);
        await runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['current_academic_year', academic_year]);

        res.json({
            message: 'Settings updated successfully',
            term,
            academic_year
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Get all unique term/year combinations from purchases (for filtering)
router.get('/terms', async (req, res) => {
    try {
        const terms = await allAsync(`
            SELECT DISTINCT term, academic_year 
            FROM purchases 
            WHERE term IS NOT NULL AND academic_year IS NOT NULL
            ORDER BY academic_year DESC, 
                CASE term 
                    WHEN 'Trinity' THEN 1 
                    WHEN 'Hilary' THEN 2 
                    WHEN 'Michaelmas' THEN 3 
                END
        `);

        res.json(terms);
    } catch (error) {
        console.error('Error fetching terms:', error);
        res.status(500).json({ error: 'Failed to fetch terms' });
    }
});

// Get all configured terms (from terms table) with purchase counts
router.get('/all-terms', async (req, res) => {
    try {
        const terms = await allAsync(`
            SELECT 
                t.term, 
                t.academic_year, 
                t.created_at,
                COUNT(p.id) as purchase_count
            FROM terms t
            LEFT JOIN purchases p ON p.term = t.term AND p.academic_year = t.academic_year
            GROUP BY t.term, t.academic_year
            ORDER BY t.academic_year DESC, 
                CASE t.term 
                    WHEN 'Trinity' THEN 1 
                    WHEN 'Hilary' THEN 2 
                    WHEN 'Michaelmas' THEN 3 
                END
        `);

        res.json(terms);
    } catch (error) {
        console.error('Error fetching all terms:', error);
        res.status(500).json({ error: 'Failed to fetch terms' });
    }
});

// Delete a term from the terms table
router.delete('/term', async (req, res) => {
    try {
        const { term, academic_year } = req.query;

        if (!term || !academic_year) {
            return res.status(400).json({ error: 'Term and academic year are required' });
        }

        await runAsync(
            'DELETE FROM terms WHERE term = ? AND academic_year = ?',
            [term, academic_year]
        );

        res.json({
            message: `Successfully deleted ${term} ${academic_year}`,
        });
    } catch (error) {
        console.error('Error deleting term:', error);
        res.status(500).json({ error: 'Failed to delete term' });
    }
});

export default router;
