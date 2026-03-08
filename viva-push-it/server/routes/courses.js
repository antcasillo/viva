/**
 * Route corsi
 */

const express = require('express');
const { db, uuid } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function toCourse(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    teacherName: row.teacher_name,
    dayOfWeek: row.day_of_week,
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    maxStudents: row.max_students,
    room: row.room,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  };
}

// GET /api/courses - tutti possono leggere
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM courses ORDER BY name').all();
  res.json(rows.map(toCourse));
});

// POST /api/courses (solo admin)
router.post('/', adminOnly, (req, res) => {
  const { name, description, teacherName, dayOfWeek, startTime, endTime, maxStudents, room, isActive } = req.body;
  if (!name || !teacherName || dayOfWeek == null || !startTime || !endTime)
    return res.status(400).json({ error: 'name, teacherName, dayOfWeek, startTime, endTime richiesti' });

  const id = uuid();
  db.prepare(
    `INSERT INTO courses (id, name, description, teacher_name, day_of_week, start_time, end_time, max_students, room, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name || null, description || null, teacherName, dayOfWeek, startTime, endTime, maxStudents ?? 10, room || null, isActive !== false ? 1 : 0);

  const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  res.status(201).json(toCourse(row));
});

// PATCH /api/courses/:id (solo admin)
router.patch('/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const { name, description, teacherName, dayOfWeek, startTime, endTime, maxStudents, room, isActive } = req.body;

  const updates = [];
  const params = [];
  if (name != null) { updates.push('name = ?'); params.push(name); }
  if (description != null) { updates.push('description = ?'); params.push(description); }
  if (teacherName != null) { updates.push('teacher_name = ?'); params.push(teacherName); }
  if (dayOfWeek != null) { updates.push('day_of_week = ?'); params.push(dayOfWeek); }
  if (startTime != null) { updates.push('start_time = ?'); params.push(startTime); }
  if (endTime != null) { updates.push('end_time = ?'); params.push(endTime); }
  if (maxStudents != null) { updates.push('max_students = ?'); params.push(maxStudents); }
  if (room != null) { updates.push('room = ?'); params.push(room); }
  if (isActive != null) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }
  if (updates.length === 0) return res.status(400).json({ error: 'Nessun campo da aggiornare' });

  params.push(id);
  db.prepare(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Corso non trovato' });
  res.json(toCourse(row));
});

// DELETE /api/courses/:id (solo admin)
router.delete('/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const r = db.prepare('DELETE FROM courses WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Corso non trovato' });
  res.json({ ok: true });
});

module.exports = router;
