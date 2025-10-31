import { getDatabase } from './savings.js';

async function initializeDatabase() {
  console.log('Initializing database...');
  const db = await getDatabase();
  
  // Create savings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS savings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_name TEXT UNIQUE NOT NULL,
      account_type TEXT NOT NULL,
      institution TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create savings_history table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS savings_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_name TEXT NOT NULL,
      amount REAL NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('✅ Database initialized successfully!');
  console.log('Tables created: savings, savings_history');
  
  await db.close();
}

initializeDatabase().catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});
