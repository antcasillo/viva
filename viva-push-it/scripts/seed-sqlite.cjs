/**
 * Seed SQLite per viva.push.it
 * Esegui: npm run db:seed
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'viva.db');

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Inizializza schema (stile gestionale: migrations unificate)
const { initDb } = require('../server/migrations');
initDb(db);

function uuid() {
  return crypto.randomUUID();
}

const USERS = [
  { username: 'admin', email: 'admin@vivapush.it', password: 'admin123', full_name: 'Maria Rossi', role: 'admin', phone: null },
  { email: 'genitore.bianchi@gmail.com', password: 'user123', full_name: 'Giuseppe Bianchi', role: 'user', phone: '+39 333 1234567' },
  { email: 'anna.verdi@email.it', password: 'user123', full_name: 'Anna Verdi', role: 'user', phone: '+39 340 9876543' },
  { email: 'marco.neri@outlook.com', password: 'user123', full_name: 'Marco Neri', role: 'user', phone: '+39 328 5551234' },
  { email: 'laura.gialli@gmail.com', password: 'user123', full_name: 'Laura Gialli', role: 'user', phone: '+39 366 7778899' },
  { email: 'paolo.rossi@email.it', password: 'user123', full_name: 'Paolo Rossi', role: 'user', phone: '+39 347 2223344' },
];

const userIds = {};

console.log('🌱 Seed SQLite viva.push.it...\n');

for (const u of USERS) {
  const key = u.username || u.email;
  const existing = db.prepare('SELECT id FROM profiles WHERE email = ? OR username = ?').get(u.email, u.username || '');
  if (existing) {
    userIds[key] = existing.id;
    if (u.phone) {
      try { db.prepare('UPDATE profiles SET phone = ? WHERE id = ?').run(u.phone, existing.id); } catch (_) {}
    }
    if (u.username) {
      try { db.prepare('UPDATE profiles SET username = ? WHERE id = ?').run(u.username, existing.id); } catch (_) {}
    }
    console.log('  ✓ Utente esistente:', key);
  } else {
    const id = uuid();
    const hash = bcrypt.hashSync(u.password, 10);
    const cols = db.prepare('PRAGMA table_info(profiles)').all();
    const hasUsername = cols.some((c) => c.name === 'username');
    if (hasUsername && u.username) {
      db.prepare('INSERT INTO profiles (id, username, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, u.username, u.email, hash, u.full_name, u.phone || null, u.role);
    } else {
      db.prepare('INSERT INTO profiles (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)').run(id, u.email, hash, u.full_name, u.phone || null, u.role);
    }
    userIds[key] = id;
    console.log('  ✓ Creato:', key);
  }
}

const adminId = userIds['admin'] || userIds['admin@vivapush.it'];
const user1 = userIds['genitore.bianchi@gmail.com'];
const user2 = userIds['anna.verdi@email.it'];
const user3 = userIds['marco.neri@outlook.com'];
const user4 = userIds['laura.gialli@gmail.com'];
const user5 = userIds['paolo.rossi@email.it'];

const { count: courseCount } = db.prepare('SELECT COUNT(*) as count FROM courses').get();
if (courseCount > 0) {
  console.log('\n  ⏭ Corsi già presenti, skip.');
} else {
  const c1 = uuid(), c2 = uuid(), c3 = uuid();
  db.prepare(
    `INSERT INTO courses (id, name, description, teacher_name, day_of_week, start_time, end_time, max_students, room) VALUES
     (?, 'Pianoforte Principianti', 'Corso base per bambini 6-10 anni', 'Prof. Elena Martini', 1, '16:00', '17:00', 8, 'Aula 1'),
     (?, 'Chitarra Avanzata', 'Per allievi con almeno 2 anni di esperienza', 'Maestro Carlo Bianchi', 3, '17:30', '18:30', 6, 'Aula 2'),
     (?, 'Canto Corale', 'Laboratorio di canto per bambini e ragazzi', 'Prof.ssa Francesca Neri', 5, '15:00', '16:30', 12, 'Sala Concerti')`
  ).run(c1, c2, c3);
  const insertSched = db.prepare(
    'INSERT INTO course_schedules (id, course_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?)'
  );
  insertSched.run(uuid(), c1, 1, '16:00', '17:00');
  insertSched.run(uuid(), c2, 3, '17:30', '18:30');
  insertSched.run(uuid(), c3, 5, '15:00', '16:30');
  console.log('  ✓ Corsi creati: 3');
}

const { count: studentCount } = db.prepare('SELECT COUNT(*) as count FROM students').get();
if (studentCount > 0) {
  console.log('  ⏭ Allievi già presenti, skip.');
} else {
  const courses = db.prepare('SELECT id FROM courses ORDER BY name').all();
  const c1 = courses[0]?.id;
  const c2 = courses[1]?.id;
  const c3 = courses[2]?.id;

  const s1 = uuid(), s2 = uuid(), s3 = uuid(), s4 = uuid(), s5 = uuid();
  db.prepare(
    `INSERT INTO students (id, user_id, first_name, last_name, date_of_birth, parent_name, parent_phone, parent_email, notes) VALUES
     (?, ?, 'Luca', 'Bianchi', '2015-03-22', 'Giuseppe Bianchi', '+39 333 1234567', 'genitore.bianchi@gmail.com', 'Preferisce pianoforte'),
     (?, ?, 'Sofia', 'Verdi', '2016-07-14', 'Anna Verdi', '+39 340 9876543', 'anna.verdi@email.it', NULL),
     (?, ?, 'Matteo', 'Neri', '2014-11-08', 'Marco Neri', '+39 328 5551234', 'marco.neri@outlook.com', 'Livello avanzato chitarra'),
     (?, ?, 'Emma', 'Gialli', '2017-01-30', 'Laura Gialli', '+39 366 7778899', 'laura.gialli@gmail.com', NULL),
     (?, ?, 'Alessandro', 'Rossi', '2015-09-12', 'Paolo Rossi', '+39 347 2223344', 'paolo.rossi@email.it', NULL)`
  ).run(s1, user1, s2, user2, s3, user3, s4, user4, s5, user5);
  console.log('  ✓ Allievi creati: 5');

  if (c1 && c2 && c3) {
    db.prepare(
      `INSERT INTO course_enrollments (id, course_id, student_id, enrolled_at) VALUES
       (?, ?, ?, '2024-02-01'), (?, ?, ?, '2024-02-10'), (?, ?, ?, '2024-03-01'),
       (?, ?, ?, '2024-02-15'), (?, ?, ?, '2024-02-20'),
       (?, ?, ?, '2024-02-10'), (?, ?, ?, '2024-02-15'), (?, ?, ?, '2024-03-05')`
    ).run(uuid(), c1, s1, uuid(), c1, s2, uuid(), c1, s4, uuid(), c2, s3, uuid(), c2, s1, uuid(), c3, s2, uuid(), c3, s3, uuid(), c3, s5);
    console.log('  ✓ Iscrizioni create');

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().slice(0, 10);

    const runAtt = db.prepare(
      `INSERT INTO attendances (id, course_id, student_id, session_date, session_start_time, status, absence_reason, marked_at, marked_by) VALUES
       (?, ?, ?, ?, '16:00', 'present', NULL, ? || 'T16:05:00Z', ?),
       (?, ?, ?, ?, '16:00', 'absent_preavvisato', 'Influenza', NULL, NULL),
       (?, ?, ?, ?, '16:00', 'present', NULL, ? || 'T16:02:00Z', ?),
       (?, ?, ?, ?, '17:30', 'present', NULL, ? || 'T17:35:00Z', ?),
       (?, ?, ?, ?, '17:30', 'absent', NULL, ? || 'T18:00:00Z', ?),
       (?, ?, ?, ?, '15:00', 'absent_preavvisato', 'Gita scolastica', NULL, NULL),
       (?, ?, ?, ?, '15:00', 'unknown', NULL, NULL, NULL),
       (?, ?, ?, ?, '15:00', 'unknown', NULL, NULL, NULL)`
    );
    runAtt.run(
      uuid(), c1, s1, twoDaysAgo, twoDaysAgo, adminId,
      uuid(), c1, s2, twoDaysAgo,
      uuid(), c1, s4, twoDaysAgo, twoDaysAgo, adminId,
      uuid(), c2, s3, yesterday, yesterday, adminId,
      uuid(), c2, s1, yesterday, yesterday, adminId,
      uuid(), c3, s2, today,
      uuid(), c3, s3, today,
      uuid(), c3, s5, today
    );
    console.log('  ✓ Presenze create');

    db.prepare(
      `INSERT INTO payments (id, student_id, amount, description, due_date, status, paid_at, payment_reference) VALUES
       (?, ?, 80, 'Retta Marzo 2024 - Pianoforte + Chitarra', '2024-03-10', 'paid', '2024-03-05T14:30:00Z', 'SUMUP-TXN-001'),
       (?, ?, 60, 'Retta Marzo 2024 - Pianoforte', '2024-03-10', 'paid', '2024-03-02T09:15:00Z', 'SUMUP-TXN-002'),
       (?, ?, 70, 'Retta Marzo 2024 - Chitarra + Canto', '2024-03-10', 'pending', NULL, NULL),
       (?, ?, 60, 'Retta Febbraio 2024 - Pianoforte', '2024-02-28', 'expired', NULL, NULL)`
    ).run(uuid(), s1, uuid(), s2, uuid(), s3, uuid(), s4);
    console.log('  ✓ Pagamenti creati');

    const d1 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const d2 = new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10);
    const d3 = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);

    db.prepare(
      `INSERT INTO events (id, title, description, event_date, event_time, location, is_public, created_by) VALUES
       (?, 'Saggio di Primavera', 'Esibizione degli allievi dei corsi di pianoforte e chitarra. Ingresso libero per familiari.', ?, '17:00', 'Sala Concerti - Via Roma 15', 1, ?),
       (?, 'Chiusura per Festività', 'La scuola resterà chiusa per le festività pasquali. Le lezioni riprenderanno regolarmente il 2 aprile.', ?, NULL, NULL, 1, ?),
       (?, 'Concerto di Fine Anno', 'Grande concerto di fine anno con tutti i corsi. Prenotazione posti obbligatoria.', ?, '18:30', 'Teatro Comunale', 1, ?)`
    ).run(uuid(), d1, adminId, uuid(), d2, adminId, uuid(), d3, adminId);
    console.log('  ✓ Eventi creati');
  }
}

db.close();
console.log('\n✅ Seed completato!');
console.log('\nCredenziali admin: admin / admin123');
