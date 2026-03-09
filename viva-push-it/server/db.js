/**
 * Database SQLite per viva.push.it
 * Backup automatico all'avvio e ogni ora
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'viva.db');
const backupDir = path.join(dbDir, 'backups');
const MAX_BACKUPS = 24;

function pruneOldBackups() {
  try {
    if (!fs.existsSync(backupDir)) return;
    const files = fs.readdirSync(backupDir)
      .filter((f) => f.startsWith('viva-') && f.endsWith('.db'))
      .map((f) => ({ name: f, path: path.join(backupDir, f), mtime: fs.statSync(path.join(backupDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);
    files.slice(MAX_BACKUPS).forEach((f) => { try { fs.unlinkSync(f.path); } catch (_) {} });
  } catch (_) {}
}

function doBackupSync() {
  try {
    if (!fs.existsSync(dbPath)) return;
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').replace(/\..*/, '');
    const backupPath = path.join(backupDir, `viva-${ts}.db`);
    fs.copyFileSync(dbPath, backupPath);
    pruneOldBackups();
  } catch (_) {}
}

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Backup all'avvio (se il db esiste già, prima di aprirlo)
if (fs.existsSync(dbPath)) {
  doBackupSync();
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Inizializza schema (stile gestionale-push: migrations unificate)
const { initDb } = require('./migrations');
initDb(db);

function uuid() {
  return require('crypto').randomUUID();
}

// Backup periodico ogni ora
const BACKUP_INTERVAL_MS = 60 * 60 * 1000;
setInterval(() => {
  try {
    if (!fs.existsSync(dbPath)) return;
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').replace(/\..*/, '');
    const backupPath = path.join(backupDir, `viva-${ts}.db`);
    fs.copyFileSync(dbPath, backupPath);
    pruneOldBackups();
  } catch (_) {}
}, BACKUP_INTERVAL_MS);

module.exports = { db, uuid };
