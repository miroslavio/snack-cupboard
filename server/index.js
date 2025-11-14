import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, allAsync, getAsync, runAsync } from './database.js';
import staffRoutes from './routes/staff.js';
import itemRoutes from './routes/items.js';
import purchaseRoutes from './routes/purchases.js';
import settingsRoutes from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize database
await initializeDatabase();

// Routes
app.use('/api/staff', staffRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve static files from client build (only if dist exists - production mode)
const clientPath = path.join(__dirname, '..', 'client', 'dist');
const fs = await import('fs');
if (fs.default.existsSync(clientPath)) {
    app.use(express.static(clientPath));

    // SPA fallback (only in production when dist exists)
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientPath, 'index.html'));
    });
} else {
    // Development mode - just log that we're in dev
    app.get('*', (req, res) => {
        res.json({
            message: 'Development mode - use Vite on http://localhost:5173',
            api: 'Server running on http://localhost:3001'
        });
    });
}

// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
