/**
 * Verifica se una password corrisponde all'admin nel DB.
 * Uso: node scripts/check-password.cjs [password]
 * Esempio: node scripts/check-password.cjs admin123
 */

const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'viva.db');
const passwordToCheck = process.argv.slice(2).join(' ') || 'admin123';

try {
  const db = new Database(dbPath, { readonly: true });
  const admin = db.prepare(
    "SELECT username, email, password_hash FROM profiles WHERE role = 'admin' LIMIT 1"
  ).get();
  db.close();

  if (!admin) {
    console.log('Nessun admin trovato nel database.');
    process.exit(1);
  }

  const ok = bcrypt.compareSync(passwordToCheck, admin.password_hash);
  console.log(`Admin: ${admin.username || admin.email}`);
  console.log(`Password "${passwordToCheck}": ${ok ? '✓ CORRETTA' : '✗ errata'}`);
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error('Errore:', e.message);
  process.exit(1);
}
