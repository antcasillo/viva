/**
 * Backup database SQLite viva.push.it
 * Copia viva.db in data/backups/viva-YYYYMMDD-HHMMSS.db
 * Mantiene gli ultimi 24 backup
 *
 * Esegui: npm run db:backup
 */

const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'viva.db');
const backupDir = path.join(dbDir, 'backups');

const MAX_BACKUPS = 24;

function backup() {
  if (!fs.existsSync(dbPath)) {
    console.log('Nessun database da salvare (data/viva.db non esiste).');
    return;
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const ts = now.toISOString().slice(0, 19).replace(/[-:T]/g, '').replace(/\..*/, '');
  const backupPath = path.join(backupDir, `viva-${ts}.db`);

  fs.copyFileSync(dbPath, backupPath);
  console.log(`✓ Backup creato: data/backups/viva-${ts}.db`);

  // Mantieni solo gli ultimi MAX_BACKUPS
  const files = fs.readdirSync(backupDir)
    .filter((f) => f.startsWith('viva-') && f.endsWith('.db'))
    .map((f) => ({ name: f, path: path.join(backupDir, f), mtime: fs.statSync(path.join(backupDir, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length > MAX_BACKUPS) {
    files.slice(MAX_BACKUPS).forEach((f) => {
      fs.unlinkSync(f.path);
      console.log(`  Rimosso vecchio backup: ${f.name}`);
    });
  }
}

backup();
