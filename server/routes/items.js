import express from 'express';
import { allAsync, runAsync, getAsync } from '../database.js';

const router = express.Router();

// Get all items
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        let query = 'SELECT * FROM items';
        const params = [];

        if (search) {
            query += ' WHERE name LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY name ASC';
        const items = await allAsync(query, params);
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get single item
router.get('/:id', async (req, res) => {
    try {
        const item = await getAsync('SELECT * FROM items WHERE id = ?', [req.params.id]);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Create item
router.post('/', async (req, res) => {
    try {
        const { name, price } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        // Check duplicate name (case-insensitive)
        const existing = await getAsync('SELECT id FROM items WHERE LOWER(name) = LOWER(?)', [name]);
        if (existing) {
            return res.status(400).json({ error: 'Item already exists' });
        }

        const result = await runAsync(
            'INSERT INTO items (name, price) VALUES (?, ?)',
            [name, price]
        );

        res.json({ id: result.lastID, name, price });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Item already exists' });
        }
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update item
router.put('/:id', async (req, res) => {
    try {
        const { name, price } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        // Check for duplicate name on other items
        const existing = await getAsync('SELECT id FROM items WHERE LOWER(name) = LOWER(?) AND id != ?', [name, req.params.id]);
        if (existing) {
            return res.status(400).json({ error: 'Another item with that name already exists' });
        }

        await runAsync(
            'UPDATE items SET name = ?, price = ? WHERE id = ?',
            [name, price, req.params.id]
        );

        const item = await getAsync('SELECT * FROM items WHERE id = ?', [req.params.id]);
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete item
router.delete('/:id', async (req, res) => {
    try {
        await runAsync('DELETE FROM items WHERE id = ?', [req.params.id]);
        res.json({ message: 'Item deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Import items from CSV
router.post('/import-csv', express.text({ type: 'text/csv' }), async (req, res) => {
    try {
        const lines = req.body.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return res.status(400).json({ error: 'CSV must have header and at least one data row' });
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('name');
        const priceIdx = headers.indexOf('price');

        if (nameIdx === -1 || priceIdx === -1) {
            return res.status(400).json({ error: 'CSV must have columns: name, price' });
        }

        // Clear existing items
        await runAsync('DELETE FROM items');

        // Insert new items
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim());
            if (parts.length > Math.max(nameIdx, priceIdx)) {
                try {
                    const price = parseFloat(parts[priceIdx]);
                    if (isNaN(price)) continue;

                    await runAsync(
                        'INSERT INTO items (name, price) VALUES (?, ?)',
                        [parts[nameIdx], price]
                    );
                    imported++;
                } catch (err) {
                    // Skip duplicates
                    if (!err.message.includes('UNIQUE')) throw err;
                }
            }
        }

        res.json({ message: `Imported ${imported} items` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
