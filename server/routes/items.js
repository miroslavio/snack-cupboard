import express from 'express';
import { allAsync, runAsync, getAsync } from '../database.js';

const router = express.Router();

// Get all items (exclude archived)
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        const includeArchived = req.query.includeArchived === 'true';

        let query = 'SELECT * FROM items';
        const params = [];
        const conditions = [];

        if (!includeArchived) {
            conditions.push('archived_at IS NULL');
        }

        if (search) {
            conditions.push('name LIKE ?');
            params.push(`%${search}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
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
        const { name, price, category } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        // Check for archived item with same name
        const archived = await getAsync(
            'SELECT id FROM items WHERE LOWER(name) = LOWER(?) AND archived_at IS NOT NULL',
            [name]
        );

        if (archived) {
            // Restore and update the archived item
            await runAsync(
                'UPDATE items SET archived_at = NULL, price = ?, category = ? WHERE id = ?',
                [price, category || 'Food', archived.id]
            );
            const restored = await getAsync('SELECT * FROM items WHERE id = ?', [archived.id]);
            return res.json(restored);
        }

        // Check duplicate name in active items (case-insensitive)
        const existing = await getAsync(
            'SELECT id FROM items WHERE LOWER(name) = LOWER(?) AND archived_at IS NULL',
            [name]
        );
        if (existing) {
            return res.status(400).json({ error: 'Item already exists' });
        }

        const result = await runAsync(
            'INSERT INTO items (name, price, category) VALUES (?, ?, ?)',
            [name, price, category || 'Food']
        );

        res.json({ id: result.lastID, name, price, category: category || 'Food' });
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
        const { name, price, category } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        // Check for duplicate name on other active items
        const existing = await getAsync(
            'SELECT id FROM items WHERE LOWER(name) = LOWER(?) AND id != ? AND archived_at IS NULL',
            [name, req.params.id]
        );
        if (existing) {
            return res.status(400).json({ error: 'Another item with that name already exists' });
        }

        await runAsync(
            'UPDATE items SET name = ?, price = ?, category = ? WHERE id = ?',
            [name, price, category || 'Food', req.params.id]
        );

        const item = await getAsync('SELECT * FROM items WHERE id = ?', [req.params.id]);
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Archive an item by id (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        await runAsync('UPDATE items SET archived_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
        res.json({ message: 'Item archived' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Restore archived item
router.put('/:id/restore', async (req, res) => {
    try {
        const { id } = req.params;
        await runAsync('UPDATE items SET archived_at = NULL WHERE id = ?', [id]);
        res.json({ message: 'Item restored' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Hard delete item (permanently remove from database)
// Can only delete archived items to prevent accidental deletion
router.delete('/:id/permanent', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if item is archived
        const item = await getAsync('SELECT archived_at FROM items WHERE id = ?', [id]);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        if (!item.archived_at) {
            return res.status(400).json({ error: 'Can only permanently delete archived items. Archive first.' });
        }

        // Delete the item (purchases will remain with item reference)
        await runAsync('DELETE FROM items WHERE id = ?', [id]);
        res.json({ message: 'Item permanently deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Restore archived item
router.put('/:id/restore', async (req, res) => {
    try {
        await runAsync('UPDATE items SET archived_at = NULL WHERE id = ?', [req.params.id]);
        res.json({ message: 'Item restored' });
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
        const categoryIdx = headers.indexOf('category');

        if (nameIdx === -1 || priceIdx === -1) {
            return res.status(400).json({ error: 'CSV must have columns: name, price (category is optional)' });
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

                    const category = categoryIdx !== -1 && parts[categoryIdx] ? parts[categoryIdx] : 'Food';

                    await runAsync(
                        'INSERT INTO items (name, price, category) VALUES (?, ?, ?)',
                        [parts[nameIdx], price, category]
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
