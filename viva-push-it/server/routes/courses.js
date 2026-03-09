/**
 * Route corsi
 */

const express = require('express');
const { db, uuid } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function toTime(t) {
  return String(t || '').slice(0, 5) || '00:00';
}

function getSchedules(courseId) {
  const rows = db.prepare('SELECT day_of_week, start_time, end_time FROM course_schedules WHERE course_id = ? ORDER BY day_of_week, start_time').all(courseId);
  return rows.map((r) => ({
    dayOfWeek: r.day_of_week,
    startTime: toTime(r.start_time),
    endTime: toTime(r.end_time),
  }));
}

function toCourse(row) {
  const schedules = getSchedules(row.id);
  const first = schedules[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    teacherName: row.teacher_name,
    dayOfWeek: first?.dayOfWeek ?? row.day_of_week ?? 0,
    startTime: first?.startTime ?? toTime(row.start_time),
    endTime: first?.endTime ?? toTime(row.end_time),
    schedules,
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
  const { name, description, teacherName, schedules, maxStudents, room, isActive } = req.body;
  if (!name || !teacherName)
    return res.status(400).json({ error: 'name, teacherName richiesti' });

  const schedList = Array.isArray(schedules) && schedules.length > 0
    ? schedules
    : req.body.dayOfWeek != null && req.body.startTime && req.body.endTime
      ? [{ dayOfWeek: req.body.dayOfWeek, startTime: req.body.startTime, endTime: req.body.endTime }]
      : req.body.schedule
        ? [req.body.schedule]
        : [];

  if (schedList.length === 0)
    return res.status(400).json({ error: 'Almeno un orario richiesto (schedules o dayOfWeek+startTime+endTime)' });

  const first = schedList[0];
  const id = uuid();
  db.prepare(
    `INSERT INTO courses (id, name, description, teacher_name, day_of_week, start_time, end_time, max_students, room, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name || null, description || null, teacherName, first.dayOfWeek, first.startTime, first.endTime, maxStudents ?? 10, room || null, isActive !== false ? 1 : 0);

  const insertSched = db.prepare(
    'INSERT INTO course_schedules (id, course_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?)'
  );
  for (const s of schedList) {
    insertSched.run(uuid(), id, s.dayOfWeek, s.startTime, s.endTime);
  }

  const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  res.status(201).json(toCourse(row));
});

// PATCH /api/courses/:id (solo admin)
router.patch('/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const { name, description, teacherName, schedules, maxStudents, room, isActive } = req.body;

  const updates = [];
  const params = [];
  if (name != null) { updates.push('name = ?'); params.push(name); }
  if (description != null) { updates.push('description = ?'); params.push(description); }
  if (teacherName != null) { updates.push('teacher_name = ?'); params.push(teacherName); }
  if (maxStudents != null) { updates.push('max_students = ?'); params.push(maxStudents); }
  if (room != null) { updates.push('room = ?'); params.push(room); }
  if (isActive != null) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }

  if (Array.isArray(schedules) && schedules.length > 0) {
    db.prepare('DELETE FROM course_schedules WHERE course_id = ?').run(id);
    const insertSched = db.prepare(
      'INSERT INTO course_schedules (id, course_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?)'
    );
    const first = schedules[0];
    for (const s of schedules) {
      insertSched.run(uuid(), id, s.dayOfWeek, s.startTime, s.endTime);
    }
    updates.push('day_of_week = ?', 'start_time = ?', 'end_time = ?');
    params.push(first.dayOfWeek, first.startTime, first.endTime);
  }

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
