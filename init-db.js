import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  const db = await open({
    filename: path.join(__dirname, 'financial.db'),
    driver: sqlite3.Database
  });

  // Create savings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS savings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      institution TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'EUR',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS savings_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'EUR',
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_savings_account ON savings(account_name);
    CREATE INDEX IF NOT EXISTS idx_history_account ON savings_history(account_name);
    CREATE INDEX IF NOT EXISTS idx_history_date ON savings_history(recorded_at);
  `);

  console.log('✅ Database initialized successfully');
  await db.close();
}

initDatabase().catch(console.error);
