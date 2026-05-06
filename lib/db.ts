// Uses Node.js 22 built-in sqlite (stable since 22.12)
import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'airpak.db')

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

let _db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH)
    _db.exec("PRAGMA journal_mode = WAL")
    _db.exec("PRAGMA foreign_keys = ON")
    initSchema(_db)
  }
  return _db
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_email TEXT DEFAULT '',
      order_date TEXT NOT NULL,
      amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      source TEXT DEFAULT 'manual',
      email_subject TEXT DEFAULT '',
      email_snippet TEXT DEFAULT '',
      gmail_message_id TEXT UNIQUE,
      notes TEXT DEFAULT '',
      delivered_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      alert_type TEXT DEFAULT 'undelivered',
      message TEXT DEFAULT '',
      is_resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `)

  // מיגרציות
  try { db.exec(`ALTER TABLE orders ADD COLUMN received_at TEXT`) } catch {}
  try { db.exec(`ALTER TABLE orders ADD COLUMN attachments TEXT DEFAULT '[]'`) } catch {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS blocked_emails (
      gmail_message_id TEXT PRIMARY KEY,
      blocked_at TEXT DEFAULT (datetime('now'))
    )
  `)

  const defaults: Record<string, string> = {
    alert_days: '4',
    imap_email: '',
    imap_password: '',
    last_email_sync: '',
  }

  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING`
  )
  for (const [k, v] of Object.entries(defaults)) upsert.run(k, v)
}

export function getSetting(key: string): string {
  const db = getDb()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? ''
}

export function setSetting(key: string, value: string) {
  getDb().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value)
}
