/**
 * Route presenze
 */

const express = require('express');
const { db, uuid } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function toAttendance(row) {
  return {
    id: row.id,
    courseId: row.course_id,
    studentId: row.student_id,
    sessionDate: row.session_date,
    sessionStartTime: String(row.session_start_time).slice(0, 5),
    status: row.status,
    absenceReason: row.absence_reason,
    markedAt: row.marked_at,
    markedBy: row.marked_by,
  };
}

// GET /api/attendances
router.get('/', (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = db.prepare('SELECT * FROM attendances ORDER BY session_date DESC').all();
  } else {
    rows = db.prepare(
      `SELECT a.* FROM attendances a
       JOIN students s ON s.id = a.student_id
       WHERE s.user_id = ?`
    ).all(req.user.id);
    rows.sort((a, b) => b.session_date.localeCompare(a.session_date));
  }
  res.json(rows.map(toAttendance));
});

// PUT /api/attendances - upsert presenza
router.put('/', (req, res) => {
  const { courseId, studentId, sessionDate, sessionStartTime, status, absenceReason } = req.body;
  if (!courseId || !studentId || !sessionDate || !status) {
    return res.status(400).json({ error: 'courseId, studentId, sessionDate, status richiesti' });
  }

  const student = db.prepare('SELECT user_id FROM students WHERE id = ?').get(studentId);
  if (!student) return res.status(404).json({ error: 'Allievo non trovato' });
  if (req.user.role !== 'admin' && student.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Accesso negato' });
  }

  const existing = db.prepare(
    'SELECT id FROM attendances WHERE course_id = ? AND student_id = ? AND session_date = ?'
  ).get(courseId, studentId, sessionDate);

  const sessionTime = sessionStartTime || '09:00';
  const markedAt = new Date().toISOString();

  if (existing) {
    db.prepare(
      `UPDATE attendances SET status = ?, absence_reason = ?, marked_at = ?, marked_by = ? WHERE id = ?`
    ).run(status, absenceReason || null, markedAt, req.user.id, existing.id);
  } else {
    const id = uuid();
    db.prepare(
      `INSERT INTO attendances (id, course_id, student_id, session_date, session_start_time, status, absence_reason, marked_at, marked_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, courseId, studentId, sessionDate, sessionTime, status, absenceReason || null, markedAt, req.user.id);
  }
  res.json({ ok: true });
});

module.exports = router;
