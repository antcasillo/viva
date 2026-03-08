/**
 * Route iscrizioni corsi
 */

const express = require('express');
const { db, uuid } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function toEnrollment(row) {
  return {
    id: row.id,
    courseId: row.course_id,
    studentId: row.student_id,
    enrolledAt: row.enrolled_at,
    isActive: !!row.is_active,
  };
}

// GET /api/enrollments
router.get('/', (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = db.prepare('SELECT * FROM course_enrollments').all();
  } else {
    rows = db.prepare(
      `SELECT e.* FROM course_enrollments e
       JOIN students s ON s.id = e.student_id
       WHERE s.user_id = ?`
    ).all(req.user.id);
  }
  res.json(rows.map(toEnrollment));
});

// POST /api/enrollments (solo admin)
router.post('/', adminOnly, (req, res) => {
  const { courseId, studentId, enrolledAt, isActive } = req.body;
  if (!courseId || !studentId) return res.status(400).json({ error: 'courseId e studentId richiesti' });

  const id = uuid();
  try {
    db.prepare(
      'INSERT INTO course_enrollments (id, course_id, student_id, enrolled_at, is_active) VALUES (?, ?, ?, ?, ?)'
    ).run(id, courseId, studentId, enrolledAt || new Date().toISOString().slice(0, 10), isActive !== false ? 1 : 0);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Iscrizione già esistente' });
    throw e;
  }
  const row = db.prepare('SELECT * FROM course_enrollments WHERE id = ?').get(id);
  res.status(201).json(toEnrollment(row));
});

// DELETE /api/enrollments - rimuovi per courseId+studentId
router.delete('/', adminOnly, (req, res) => {
  const { courseId, studentId } = req.query;
  if (!courseId || !studentId) return res.status(400).json({ error: 'courseId e studentId richiesti' });
  const r = db.prepare('DELETE FROM course_enrollments WHERE course_id = ? AND student_id = ?').run(courseId, studentId);
  res.json({ deleted: r.changes });
});

module.exports = router;
