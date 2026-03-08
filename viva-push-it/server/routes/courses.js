/**
 * Route corsi
 */

const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

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

module.exports = router;
