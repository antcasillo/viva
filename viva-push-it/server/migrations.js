/**
 * Database schema migrations - stile gestionale-push
 * Unico punto di inizializzazione: init_db(db)
 * Aggiunge colonne con try/catch (ALTER TABLE)
 */

function initDb(db) {
  // Tabella migrations per tracciare esecuzioni
  db.exec(`CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY, executed_at TEXT)`);

  // --- Schema principale ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      photo_url TEXT,
      parent_name TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      parent_email TEXT NOT NULL,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      teacher_name TEXT NOT NULL,
      day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      max_students INTEGER NOT NULL DEFAULT 10,
      room TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      enrolled_at TEXT NOT NULL DEFAULT (date('now')),
      is_active INTEGER DEFAULT 1,
      UNIQUE(course_id, student_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS attendances (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      session_date TEXT NOT NULL,
      session_start_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('present', 'absent', 'absent_preavvisato', 'unknown')),
      absence_reason TEXT,
      marked_at TEXT,
      marked_by TEXT REFERENCES profiles(id),
      UNIQUE(course_id, student_id, session_date)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'expired', 'cancelled')),
      paid_at TEXT,
      payment_reference TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT,
      location TEXT,
      is_public INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      created_by TEXT NOT NULL REFERENCES profiles(id)
    )
  `);

  // Indici
  db.exec(`CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_attendances_session ON attendances(course_id, student_id, session_date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id)`);

  // --- Migrazioni: aggiungi colonne se non esistono ---
  const alterColumns = [
    { table: 'profiles', column: 'phone', def: 'TEXT' },
    { table: 'profiles', column: 'username', def: 'TEXT' },
    // Aggiungere qui nuove colonne per future migrazioni
  ];

  for (const { table, column, def } of alterColumns) {
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all();
      if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
      }
    } catch (_) {
      // Colonna già esistente o errore
    }
  }

  // Bootstrap admin (opzionale, come gestionale)
  const count = db.prepare('SELECT COUNT(*) as n FROM profiles').get();
  if (count.n === 0) {
    const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (bootstrapPassword) {
      const bcrypt = require('bcryptjs');
      const crypto = require('crypto');
      const id = crypto.randomUUID();
      const hash = bcrypt.hashSync(bootstrapPassword, 10);
      const cols = db.prepare("PRAGMA table_info(profiles)").all();
      const hasUsername = cols.some((c) => c.name === 'username');
      if (hasUsername) {
        db.prepare(
          `INSERT INTO profiles (id, username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?, ?)`
        ).run(id, 'admin', 'admin@vivapush.it', hash, 'Amministratore', 'admin');
      } else {
        db.prepare(
          `INSERT INTO profiles (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)`
        ).run(id, 'admin@vivapush.it', hash, 'Amministratore', 'admin');
      }
      console.log('  ✓ Admin bootstrap creato (username: admin)');
    }
  }

  // Migrazione: imposta username='admin' per admin esistente senza username
  try {
    const cols = db.prepare("PRAGMA table_info(profiles)").all();
    if (cols.some((c) => c.name === 'username')) {
      db.prepare("UPDATE profiles SET username = 'admin' WHERE role = 'admin' AND (username IS NULL OR username = '')").run();
    }
  } catch (_) {}
}

module.exports = { initDb };
