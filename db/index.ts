import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'vapeshub.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let _db: Database.Database | null = null;

function columnExists(db: Database.Database, tableName: string, columnName: string): boolean {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
    return columns.some((column) => column.name === columnName);
}

function ensureSchemaUpgrades(db: Database.Database): void {
    db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      owner_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );
  `);

    if (!columnExists(db, 'users', 'store_id')) {
        db.exec('ALTER TABLE users ADD COLUMN store_id INTEGER REFERENCES stores(id);');
    }

    if (!columnExists(db, 'products', 'store_id')) {
        db.exec('ALTER TABLE products ADD COLUMN store_id INTEGER REFERENCES stores(id);');
    }

    if (!columnExists(db, 'orders', 'store_id')) {
        db.exec('ALTER TABLE orders ADD COLUMN store_id INTEGER REFERENCES stores(id);');
    }

    db.exec('CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);');
}

export function getDb(): Database.Database {
    if (!_db) {
        _db = new Database(DB_PATH);
        _db.pragma('journal_mode = WAL');
        _db.pragma('foreign_keys = ON');

        // Run schema on first connection
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        _db.exec(schema);
        ensureSchemaUpgrades(_db);
    }
    return _db;
}

export default getDb;
