/**
 * Route profili utenti (solo admin)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { db, uuid } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
router.use(adminOnly);

// GET /api/profiles - tutti i profili
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, email, full_name, role, avatar_url, created_at FROM profiles ORDER BY created_at DESC').all();
  res.json(rows.map((r) => ({ id: r.id, email: r.email, fullName: r.full_name, role: r.role, avatarUrl: r.avatar_url, createdAt: r.created_at })));
});

// PATCH /api/profiles/:id - aggiorna profilo
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { fullName, role } = req.body;

  const updates = [];
  const params = [];
  if (req.body.fullName != null) { updates.push('full_name = ?'); params.push(req.body.fullName); }
  if (req.body.role != null) { updates.push('role = ?'); params.push(req.body.role); }
  if (updates.length === 0) return res.status(400).json({ error: 'Nessun campo da aggiornare' });

  params.push(id);
  db.prepare(`UPDATE profiles SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

// POST /api/profiles - crea utente (admin)
router.post('/', (req, res) => {
  const { email, password, fullName, role } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password e nome richiesti' });
  }

  const existing = db.prepare('SELECT id FROM profiles WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(400).json({ error: 'Email già registrata' });

  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO profiles (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, email.toLowerCase().trim(), hash, fullName.trim(), role || 'user');

  const user = db.prepare('SELECT id, email, full_name, role, created_at FROM profiles WHERE id = ?').get(id);
  res.status(201).json({ id: user.id, email: user.email, fullName: user.full_name, role: user.role, createdAt: user.created_at });
});

module.exports = router;
