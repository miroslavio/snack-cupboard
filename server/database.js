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
            // Staff table - using initials as the unique identifier
            db.run(`
        CREATE TABLE IF NOT EXISTS staff (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          initials TEXT UNIQUE NOT NULL,
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

            // Add archived_at column to staff if it doesn't exist
            db.run(`ALTER TABLE staff ADD COLUMN archived_at DATETIME DEFAULT NULL`, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    console.error('Error adding archived_at to staff:', err.message);
                }
            });

            // MIGRATION: Check if old staffId column exists and migrate if needed
            db.all(`PRAGMA table_info(staff)`, [], (err, columns) => {
                if (err) {
                    console.error('Error checking staff table structure:', err);
                    return;
                }

                const hasStaffId = columns.some(col => col.name === 'staffId');
                const hasStaffInitials = columns.some(col => col.name === 'initials');

                if (hasStaffId && hasStaffInitials) {
                    console.log('Migrating staff table from staffId to initials as primary identifier...');

                    // Check if purchases table needs migration
                    db.all(`PRAGMA table_info(purchases)`, [], (err, purchaseCols) => {
                        if (err) {
                            console.error('Error checking purchases table:', err);
                            return;
                        }

                        const hasOldStaffId = purchaseCols.some(col => col.name === 'staffId');
                        const hasNewStaffInitials = purchaseCols.some(col => col.name === 'staffInitials');

                        if (hasOldStaffId && !hasNewStaffInitials) {
                            // Add new staffInitials column to purchases
                            db.run(`ALTER TABLE purchases ADD COLUMN staffInitials TEXT`, (err) => {
                                if (err && !err.message.includes('duplicate column')) {
                                    console.error('Error adding staffInitials to purchases:', err);
                                    return;
                                }

                                // Migrate data: copy initials from staff table to purchases
                                db.run(`
                                    UPDATE purchases 
                                    SET staffInitials = (
                                        SELECT staff.initials 
                                        FROM staff 
                                        WHERE staff.staffId = purchases.staffId
                                    )
                                    WHERE staffInitials IS NULL
                                `, (err) => {
                                    if (err) {
                                        console.error('Error migrating purchase data:', err);
                                        return;
                                    }
                                    console.log('Successfully migrated purchases to use staff initials');

                                    // Note: We keep the old staffId column in purchases for now for safety
                                    // It can be manually dropped later if needed
                                });
                            });
                        }
                    });

                    // Note: We keep the old staffId column in staff for now for safety
                    // It can be manually dropped later if needed
                    console.log('Migration check complete. Old staffId columns retained for safety.');
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
