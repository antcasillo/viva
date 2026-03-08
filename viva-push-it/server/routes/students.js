/**
 * Route allievi
 */

const express = require('express');
const { db, uuid } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function toStudent(row) {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    photoUrl: row.photo_url,
    parentName: row.parent_name,
    parentPhone: row.parent_phone,
    parentEmail: row.parent_email,
    notes: row.notes,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/students
router.get('/', (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = db.prepare('SELECT * FROM students ORDER BY created_at DESC').all();
  } else {
    rows = db.prepare('SELECT * FROM students WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  }
  res.json(rows.map(toStudent));
});

// POST /api/students (solo admin)
router.post('/', adminOnly, (req, res) => {
  const { userId, firstName, lastName, dateOfBirth, parentName, parentPhone, parentEmail, notes, photoUrl, isActive } = req.body;
  if (!userId || !firstName || !lastName || !dateOfBirth || !parentName || !parentPhone || !parentEmail) {
    return res.status(400).json({ error: 'Campi obbligatori mancanti' });
  }

  const id = uuid();
  db.prepare(
    `INSERT INTO students (id, user_id, first_name, last_name, date_of_birth, photo_url, parent_name, parent_phone, parent_email, notes, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, firstName, lastName, dateOfBirth, photoUrl || null, parentName, parentPhone, parentEmail, notes || null, isActive !== false ? 1 : 0);

  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  res.status(201).json(toStudent(row));
});

// PATCH /api/students/:id
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Allievo non trovato' });
  if (req.user.role !== 'admin' && row.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Accesso negato' });
  }

  const allowed = ['firstName', 'lastName', 'dateOfBirth', 'photoUrl', 'parentName', 'parentPhone', 'parentEmail', 'notes', 'isActive'];
  const dbCols = { firstName: 'first_name', lastName: 'last_name', dateOfBirth: 'date_of_birth', photoUrl: 'photo_url', parentName: 'parent_name', parentPhone: 'parent_phone', parentEmail: 'parent_email', isActive: 'is_active' };
  const updates = [];
  const params = [];
  for (const [key, val] of Object.entries(req.body)) {
    if (allowed.includes(key) && val !== undefined) {
      const col = dbCols[key] || key;
      updates.push(`${col} = ?`);
      params.push(key === 'isActive' ? (val ? 1 : 0) : val);
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'Nessun campo da aggiornare' });

  params.push(id);
  db.prepare(`UPDATE students SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  res.json(toStudent(updated));
});

module.exports = router;
