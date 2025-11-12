import express from 'express';
import { allAsync, runAsync } from '../database.js';
import json2csvPkg from 'json2csv';
const { Parser } = json2csvPkg;

const router = express.Router();

// Record a purchase
router.post('/', async (req, res) => {
    try {
        const { staffId, items } = req.body;
        if (!staffId || !items || items.length === 0) {
            return res.status(400).json({ error: 'staffId and items are required' });
        }

        for (const item of items) {
            await runAsync(
                'INSERT INTO purchases (staffId, itemId, quantity, price) VALUES (?, ?, ?, ?)',
                [staffId, item.id, item.quantity, item.price]
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
        p.staffId,
        s.forename,
        s.surname,
        s.initials,
        i.name as itemName,
        p.quantity,
        p.price,
        p.timestamp
      FROM purchases p
      JOIN staff s ON p.staffId = s.staffId
      JOIN items i ON p.itemId = i.id
      ORDER BY p.timestamp DESC
    `);

        res.json(purchases);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Export purchases as CSV
router.get('/export/csv', async (req, res) => {
    try {
        const purchases = await allAsync(`
      SELECT 
        p.id,
        p.staffId,
        s.forename,
        s.surname,
        s.initials,
        i.name as itemName,
        p.quantity,
        p.price,
        p.timestamp
      FROM purchases p
      JOIN staff s ON p.staffId = s.staffId
      JOIN items i ON p.itemId = i.id
      ORDER BY p.timestamp DESC
    `);

        if (purchases.length === 0) {
            return res.status(400).json({ error: 'No purchases to export' });
        }

        const fields = ['id', 'staffId', 'forename', 'surname', 'initials', 'itemName', 'quantity', 'price', 'timestamp'];
        const parser = new Parser({ fields });
        const csv = parser.parse(purchases);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="purchases.csv"');
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
        s.staffId,
        s.forename,
        s.surname,
        s.initials,
        COUNT(p.id) as itemCount,
        ROUND(SUM(p.price * p.quantity), 2) as totalSpent,
        GROUP_CONCAT(DISTINCT DATE(p.timestamp)) as purchaseDates
      FROM staff s
      LEFT JOIN purchases p ON s.staffId = p.staffId
      GROUP BY s.staffId, s.forename, s.surname, s.initials
      ORDER BY s.surname ASC, s.forename ASC
    `);

        res.json(summary);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
