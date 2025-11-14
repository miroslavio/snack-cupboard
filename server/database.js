import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'snacks.db');

const db = new sqlite3.Database(DB_PATH);

// Initialize database tables
export function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Staff table
            db.run(`
        CREATE TABLE IF NOT EXISTS staff (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          staffId TEXT UNIQUE NOT NULL,
          initials TEXT NOT NULL,
          surname TEXT NOT NULL,
          forename TEXT NOT NULL,
          archived_at DATETIME DEFAULT NULL
        )
      `);

            // Items table
            db.run(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          price REAL NOT NULL,
          category TEXT DEFAULT 'Food',
          archived_at DATETIME DEFAULT NULL
        )
      `);

            // Settings table for term and academic year
            db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

            // Terms table to track all configured terms
            db.run(`
        CREATE TABLE IF NOT EXISTS terms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          term TEXT NOT NULL,
          academic_year TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(term, academic_year)
        )
      `);

            // Purchases table
            db.run(`
        CREATE TABLE IF NOT EXISTS purchases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          staffId TEXT NOT NULL,
          itemId INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          item_name TEXT NOT NULL,
          term TEXT NOT NULL,
          academic_year TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(staffId) REFERENCES staff(staffId),
          FOREIGN KEY(itemId) REFERENCES items(id)
        )
      `);

            // Add archived_at column to staff if it doesn't exist
            db.run(`ALTER TABLE staff ADD COLUMN archived_at DATETIME DEFAULT NULL`, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    console.error('Error adding archived_at to staff:', err.message);
                }
            });

            // Add archived_at column to items if it doesn't exist
            db.run(`ALTER TABLE items ADD COLUMN archived_at DATETIME DEFAULT NULL`, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    console.error('Error adding archived_at to items:', err.message);
                }
            });

            // Add category column to existing items table if it doesn't exist
            db.run(`ALTER TABLE items ADD COLUMN category TEXT DEFAULT 'Food'`, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    console.error('Error adding category column:', err.message);
                }
            });

            // Add term column to purchases if it doesn't exist
            db.run(`ALTER TABLE purchases ADD COLUMN term TEXT DEFAULT 'Michaelmas'`, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    console.error('Error adding term to purchases:', err.message);
                }
            });

            // Add academic_year column to purchases if it doesn't exist
            db.run(`ALTER TABLE purchases ADD COLUMN academic_year TEXT DEFAULT '2024-25'`, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    console.error('Error adding academic_year to purchases:', err.message);
                }
            });

            // Add item_name column to purchases if it doesn't exist (to preserve item name even if item is deleted)
            db.run(`ALTER TABLE purchases ADD COLUMN item_name TEXT`, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    console.error('Error adding item_name to purchases:', err.message);
                }
            });

            // Initialize default settings if they don't exist
            db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('current_term', 'Michaelmas')`, (err) => {
                if (err) console.error('Error setting default term:', err.message);
            });

            db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('current_academic_year', '2024-25')`, (err) => {
                if (err) {
                    console.error('Error setting default academic year:', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
}

export function getDatabase() {
    return db;
}

export function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

export function getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

export function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}
