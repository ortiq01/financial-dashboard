import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function getDatabase() {
  if (!db) {
    db = await open({
      filename: path.join(__dirname, 'financial.db'),
      driver: sqlite3.Database
    });
  }
  return db;
}

export async function getSavings() {
  const database = await getDatabase();
  return await database.all('SELECT * FROM savings ORDER BY account_name');
}

export async function updateSavings(accountName, accountType, institution, amount) {
  const database = await getDatabase();
  
  // Check if record exists
  const existing = await database.get(
    'SELECT id FROM savings WHERE account_name = ?',
    accountName
  );

  if (existing) {
    // Update existing
    await database.run(
      `UPDATE savings 
       SET amount = ?, account_type = ?, institution = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE account_name = ?`,
      amount, accountType, institution, accountName
    );
  } else {
    // Insert new
    await database.run(
      `INSERT INTO savings (account_name, account_type, institution, amount) 
       VALUES (?, ?, ?, ?)`,
      accountName, accountType, institution, amount
    );
  }

  // Record in history
  await database.run(
    'INSERT INTO savings_history (account_name, amount) VALUES (?, ?)',
    accountName, amount
  );

  return await database.get('SELECT * FROM savings WHERE account_name = ?', accountName);
}

export async function getSavingsHistory(accountName, days = 30) {
  const database = await getDatabase();
  return await database.all(
    `SELECT * FROM savings_history 
     WHERE account_name = ? 
     AND recorded_at >= datetime('now', '-' || ? || ' days')
     ORDER BY recorded_at DESC`,
    accountName, days
  );
}

export async function getTotalSavings() {
  const database = await getDatabase();
  const result = await database.get('SELECT SUM(amount) as total FROM savings');
  return result?.total || 0;
}
