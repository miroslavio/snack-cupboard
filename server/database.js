import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow overriding DB location via env; default to ../data/snacks.db
const DB_PATH = process.env.SNACKCUPBOARD_DB_PATH
    ? path.resolve(process.env.SNACKCUPBOARD_DB_PATH)
    : path.join(__dirname, '..', 'data', 'snacks.db');

// Ensure directory exists to avoid SQLITE_CANTOPEN on first run
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Initialize database tables (clean schema, no legacy migration logic)
export function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS staff (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  initials TEXT UNIQUE NOT NULL,
                  surname TEXT NOT NULL,
                  forename TEXT NOT NULL,
                  archived_at DATETIME DEFAULT NULL
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS items (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT UNIQUE NOT NULL,
                  price REAL NOT NULL,
                  category TEXT DEFAULT 'Food',
                  archived_at DATETIME DEFAULT NULL
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS settings (
                  key TEXT PRIMARY KEY,
                  value TEXT NOT NULL
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS terms (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  term TEXT NOT NULL,
                  academic_year TEXT NOT NULL,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE(term, academic_year)
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS purchases (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  staffInitials TEXT NOT NULL,
                  itemId INTEGER NOT NULL,
                  quantity INTEGER NOT NULL,
                  price REAL NOT NULL,
                  item_name TEXT NOT NULL,
                  term TEXT NOT NULL,
                  academic_year TEXT NOT NULL,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(staffInitials) REFERENCES staff(initials),
                  FOREIGN KEY(itemId) REFERENCES items(id)
                )
            `);

            // Defaults
            db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('current_term', 'Michaelmas')`);
            db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('current_academic_year', '2024-25')`, (err) => {
                if (err) {
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
