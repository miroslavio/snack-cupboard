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
          forename TEXT NOT NULL
        )
      `);

            // Items table
            db.run(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          price REAL NOT NULL,
          category TEXT DEFAULT 'Food'
        )
      `);

            // Add category column to existing items table if it doesn't exist
            db.run(`
        ALTER TABLE items ADD COLUMN category TEXT DEFAULT 'Food'
      `, (err) => {
                // Ignore error if column already exists
                if (err && !err.message.includes('duplicate column')) {
                    console.error('Error adding category column:', err.message);
                }
            });

            // Purchases table
            db.run(`
        CREATE TABLE IF NOT EXISTS purchases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          staffId TEXT NOT NULL,
          itemId INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(staffId) REFERENCES staff(staffId),
          FOREIGN KEY(itemId) REFERENCES items(id)
        )
      `, (err) => {
                if (err) reject(err);
                else resolve();
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
