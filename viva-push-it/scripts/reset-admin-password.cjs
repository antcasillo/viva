/**
 * Reimposta la password dell'admin.
 * Uso: node scripts/reset-admin-password.cjs [nuova-password]
 * Esempio: node scripts/reset-admin-password.cjs dammi2000euro
 *
 * Esegui sul server: cd /var/www/viva.push.it/viva-push-it && node scripts/reset-admin-password.cjs dammi2000euro
 */

const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'viva.db');
const newPassword = process.argv.slice(2).join(' ');

if (!newPassword || newPassword.length < 6) {
  console.error('Uso: node scripts/reset-admin-password.cjs [nuova-password]');
  console.error('La password deve essere di almeno 6 caratteri.');
  process.exit(1);
}

try {
  const db = new Database(dbPath);
  const admin = db.prepare(
    "SELECT id, username, email FROM profiles WHERE role = 'admin' LIMIT 1"
  ).get();

  if (!admin) {
    console.error('Nessun admin trovato nel database.');
    process.exit(1);
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE profiles SET password_hash = ? WHERE id = ?').run(hash, admin.id);
  db.close();

  console.log(`✓ Password admin aggiornata per ${admin.username || admin.email}`);
  console.log(`  Puoi accedere con: ${admin.username || admin.email} / [la password che hai impostato]`);
} catch (e) {
  console.error('Errore:', e.message);
  process.exit(1);
}
