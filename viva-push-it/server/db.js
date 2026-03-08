/**
 * Database SQLite per viva.push.it
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'viva.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Inizializza schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// Migration: aggiungi phone a profiles se non esiste
try {
  const cols = db.prepare("PRAGMA table_info(profiles)").all();
  if (!cols.some((c) => c.name === 'phone')) {
    db.exec('ALTER TABLE profiles ADD COLUMN phone TEXT');
  }
} catch (_) {}

function uuid() {
  return require('crypto').randomUUID();
}

module.exports = { db, uuid };
