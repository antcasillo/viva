/**
 * Svuota tutti i dati demo (allievi, corsi, presenze, pagamenti, eventi, iscrizioni).
 * Mantiene solo i profili utenti (admin, genitori).
 *
 * Uso: node scripts/clear-demo-data.cjs
 */

const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'viva.db');

try {
  const db = new Database(dbPath);
  db.exec(`
    DELETE FROM attendances;
    DELETE FROM payments;
    DELETE FROM course_enrollments;
    DELETE FROM events;
    DELETE FROM students;
    DELETE FROM courses;
  `);
  db.close();
  console.log('✓ Dati demo eliminati. Restano solo i profili utenti.');
} catch (e) {
  console.error('Errore:', e.message);
  process.exit(1);
}
