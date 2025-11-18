import express from 'express';
import { allAsync, runAsync, getAsync } from '../database.js';
import json2csvPkg from 'json2csv';
const { Parser } = json2csvPkg;

const router = express.Router();

console.log('Purchases routes module loaded');

// Record a purchase
router.post('/', async (req, res) => {
    try {
        const { staffInitials: rawStaffInitials, items } = req.body;
        const staffInitials = rawStaffInitials?.toUpperCase();
        if (!staffInitials || !items || items.length === 0) {
            return res.status(400).json({ error: 'staffInitials and items are required' });
        }

        // Get current term and academic year from settings
        const termSetting = await getAsync('SELECT value FROM settings WHERE key = ?', ['current_term']);
        const yearSetting = await getAsync('SELECT value FROM settings WHERE key = ?', ['current_academic_year']);

        const currentTerm = termSetting?.value || 'Michaelmas';
        const currentYear = yearSetting?.value || '2024-25';

        for (const item of items) {
            await runAsync(
                'INSERT INTO purchases (staffInitials, itemId, quantity, price, item_name, term, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [staffInitials, item.id, item.quantity, item.price, item.name, currentTerm, currentYear]
            );
        }

        res.json({ message: 'Purchase recorded successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get all purchases (for admin)
router.get('/', async (req, res) => {
    try {
        const purchases = await allAsync(`
      SELECT 
        p.id,
        p.staffInitials,
        s.forename,
        s.surname,
        s.initials,
        COALESCE(p.item_name, i.name) as itemName,
        p.quantity,
        p.price,
        (p.price * p.quantity) as totalPrice,
        p.term,
        p.academic_year,
        p.timestamp
      FROM purchases p
      LEFT JOIN staff s ON p.staffInitials = s.initials
      LEFT JOIN items i ON p.itemId = i.id
      ORDER BY p.timestamp DESC
    `);

        res.json(purchases);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update a purchase
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { staffInitials: rawStaffInitials, itemName, quantity, totalPrice } = req.body;
        const staffInitials = rawStaffInitials?.toUpperCase();

        if (!staffInitials || !itemName || !quantity || !totalPrice) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Find the item ID by name
        const item = await allAsync('SELECT id, name FROM items WHERE name = ?', [itemName]);

        let itemId = null;
        let storedItemName = itemName;

        if (item && item.length > 0) {
            itemId = item[0].id;
            storedItemName = item[0].name;
        }

        const price = totalPrice / quantity; // Calculate unit price

        await runAsync(
            'UPDATE purchases SET staffInitials = ?, itemId = ?, quantity = ?, price = ?, item_name = ? WHERE id = ?',
            [staffInitials, itemId, quantity, price, storedItemName, id]
        );

        res.json({ message: 'Purchase updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Bulk delete purchases by term and academic year (MUST BE BEFORE /:id route)
router.delete('/bulk-delete', async (req, res) => {
    try {
        const { term, academic_year } = req.query;

        console.log('Bulk delete request:', { term, academic_year });

        if (!term || !academic_year) {
            return res.status(400).json({ error: 'Term and academic year are required' });
        }

        // Count purchases to be deleted
        const countResult = await allAsync(
            'SELECT COUNT(*) as count FROM purchases WHERE term = ? AND academic_year = ?',
            [term, academic_year]
        );

        const count = countResult[0]?.count || 0;
        console.log('Purchases to delete:', count);

        // Delete purchases (even if count is 0, we still want to allow cleanup)
        const result = await runAsync(
            'DELETE FROM purchases WHERE term = ? AND academic_year = ?',
            [term, academic_year]
        );

        console.log('Delete result:', result);

        res.json({
            message: `Successfully deleted ${count} purchase(s) from ${term} ${academic_year}`,
            count
        });
    } catch (err) {
        console.error('Bulk delete error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Bulk delete selected purchases by IDs
router.post('/bulk/delete', async (req, res) => {
    try {
        const { purchaseIds } = req.body;
        if (!Array.isArray(purchaseIds) || purchaseIds.length === 0) {
            return res.status(400).json({ error: 'purchaseIds array required' });
        }

        const placeholders = purchaseIds.map(() => '?').join(',');
        await runAsync(
            `DELETE FROM purchases WHERE id IN (${placeholders})`,
            purchaseIds
        );

        res.json({ message: `Permanently deleted ${purchaseIds.length} purchase(s)` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a purchase
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await runAsync('DELETE FROM purchases WHERE id = ?', [id]);
        res.json({ message: 'Purchase deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Export purchases as CSV
router.get('/export/csv', async (req, res) => {
    try {
        const { term, academic_year } = req.query;

        let query = `
      SELECT 
        p.id,
        p.staffInitials,
        s.forename,
        s.surname,
        s.initials,
        COALESCE(p.item_name, i.name) as itemName,
        p.quantity,
        p.price,
        p.term,
        p.academic_year,
        p.timestamp
      FROM purchases p
      LEFT JOIN staff s ON p.staffInitials = s.initials
      LEFT JOIN items i ON p.itemId = i.id
        `;

        const params = [];
        const conditions = [];

        if (term) {
            conditions.push('p.term = ?');
            params.push(term);
        }

        if (academic_year) {
            conditions.push('p.academic_year = ?');
            params.push(academic_year);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY p.timestamp DESC';

        const purchases = await allAsync(query, params);

        if (purchases.length === 0) {
            return res.status(400).json({ error: 'No purchases to export' });
        }

        const fields = ['id', 'staffInitials', 'forename', 'surname', 'initials', 'itemName', 'quantity', 'price', 'term', 'academic_year', 'timestamp'];
        const parser = new Parser({ fields });
        const csv = parser.parse(purchases);

        const filename = term && academic_year
            ? `purchases_${academic_year}_${term}.csv`
            : 'purchases.csv';

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get purchase summary by staff member
router.get('/summary/by-staff', async (req, res) => {
    try {
        const summary = await allAsync(`
      SELECT 
        s.initials,
        s.forename,
        s.surname,
        COUNT(p.id) as itemCount,
        ROUND(SUM(p.price * p.quantity), 2) as totalSpent,
        GROUP_CONCAT(DISTINCT DATE(p.timestamp)) as purchaseDates
      FROM staff s
      LEFT JOIN purchases p ON s.initials = p.staffInitials
      GROUP BY s.initials, s.forename, s.surname
      ORDER BY s.surname ASC, s.forename ASC
    `);

        res.json(summary);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get purchases for a specific staff member (for their personal view)
router.get('/staff/:initials', async (req, res) => {
    try {
        const staffInitials = req.params.initials.toUpperCase();

        // Get current term settings
        const termSetting = await getAsync('SELECT value FROM settings WHERE key = ?', ['current_term']);
        const yearSetting = await getAsync('SELECT value FROM settings WHERE key = ?', ['current_academic_year']);
        const currentTerm = termSetting?.value || 'Michaelmas';
        const currentYear = yearSetting?.value || '2024-25';

        // Get purchases for current term
        const currentTermPurchases = await allAsync(`
            SELECT 
                p.id,
                p.itemId,
                COALESCE(p.item_name, i.name) as itemName,
                p.quantity,
                p.price,
                p.term,
                p.academic_year,
                p.timestamp
            FROM purchases p
            LEFT JOIN items i ON p.itemId = i.id
            WHERE p.staffInitials = ? AND p.term = ? AND p.academic_year = ?
            ORDER BY p.timestamp DESC
        `, [staffInitials, currentTerm, currentYear]);

        // Get current term summary
        const currentTermSummary = await getAsync(`
            SELECT 
                COUNT(p.id) as itemCount,
                ROUND(SUM(p.price * p.quantity), 2) as totalSpent
            FROM purchases p
            WHERE p.staffInitials = ? AND p.term = ? AND p.academic_year = ?
        `, [staffInitials, currentTerm, currentYear]);

        // Get all-time summary by term
        const termSummaries = await allAsync(`
            SELECT 
                p.term,
                p.academic_year,
                COUNT(p.id) as itemCount,
                ROUND(SUM(p.price * p.quantity), 2) as totalSpent
            FROM purchases p
            WHERE p.staffInitials = ?
            GROUP BY p.term, p.academic_year
            ORDER BY p.academic_year DESC, 
                CASE p.term 
                    WHEN 'Trinity' THEN 1 
                    WHEN 'Hilary' THEN 2 
                    WHEN 'Michaelmas' THEN 3 
                END
        `, [staffInitials]);

        res.json({
            currentTerm,
            currentYear,
            currentTermPurchases,
            currentTermSummary: {
                itemCount: currentTermSummary?.itemCount || 0,
                totalSpent: currentTermSummary?.totalSpent || 0
            },
            termSummaries
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
