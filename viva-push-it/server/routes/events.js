/**
 * Route eventi (bacheca)
 */

const express = require('express');
const { db, uuid } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function toEvent(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eventDate: row.event_date,
    eventTime: row.event_time ? String(row.event_time).slice(0, 5) : undefined,
    location: row.location,
    isPublic: !!row.is_public,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

// GET /api/events - tutti leggono eventi pubblici
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM events WHERE is_public = 1 ORDER BY event_date ASC').all();
  res.json(rows.map(toEvent));
});

// POST /api/events (solo admin)
router.post('/', adminOnly, (req, res) => {
  const { title, description, eventDate, eventTime, location, isPublic } = req.body;
  if (!title || !description || !eventDate) return res.status(400).json({ error: 'title, description, eventDate richiesti' });

  const id = uuid();
  db.prepare(
    `INSERT INTO events (id, title, description, event_date, event_time, location, is_public, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, title, description, eventDate, eventTime || null, location || null, isPublic !== false ? 1 : 0, req.user.id);

  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  res.status(201).json(toEvent(row));
});

// PATCH /api/events/:id (solo admin)
router.patch('/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const { title, description, eventDate, eventTime, location, isPublic } = req.body;

  const allowed = ['title', 'description', 'event_date', 'event_time', 'location', 'is_public'];
  const updates = [];
  const params = [];
  if (title != null) { updates.push('title = ?'); params.push(title); }
  if (description != null) { updates.push('description = ?'); params.push(description); }
  if (eventDate != null) { updates.push('event_date = ?'); params.push(eventDate); }
  if (eventTime != null) { updates.push('event_time = ?'); params.push(eventTime); }
  if (location != null) { updates.push('location = ?'); params.push(location); }
  if (isPublic != null) { updates.push('is_public = ?'); params.push(isPublic ? 1 : 0); }
  if (updates.length === 0) return res.status(400).json({ error: 'Nessun campo da aggiornare' });

  params.push(id);
  db.prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  res.json(toEvent(row));
});

// DELETE /api/events/:id (solo admin)
router.delete('/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM events WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
