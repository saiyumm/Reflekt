import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.join(__dirname, '..', 'data');
export const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');
const DB_PATH = path.join(DATA_DIR, 'reflekt.db');

// Ensure data directories exist
fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS updates (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      description   TEXT,
      date          TEXT NOT NULL,
      category      TEXT NOT NULL DEFAULT 'other',
      tags          TEXT DEFAULT '[]',
      status        TEXT NOT NULL DEFAULT 'completed',
      is_auto_categorized INTEGER DEFAULT 1,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id            TEXT PRIMARY KEY,
      update_id     TEXT NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
      type          TEXT NOT NULL,
      filename      TEXT,
      filepath      TEXT,
      url           TEXT,
      label         TEXT,
      before_path   TEXT,
      after_path    TEXT,
      sort_order    INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_updates_date ON updates(date);
    CREATE INDEX IF NOT EXISTS idx_updates_category ON updates(category);
    CREATE INDEX IF NOT EXISTS idx_attachments_update ON attachments(update_id);
  `);
}

export default db;
