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
  const rows = db.prepare('SELECT id, email, full_name, phone, role, avatar_url, created_at FROM profiles ORDER BY created_at DESC').all();
  res.json(rows.map((r) => ({ id: r.id, email: r.email, fullName: r.full_name, phone: r.phone, role: r.role, avatarUrl: r.avatar_url, createdAt: r.created_at })));
});

// PATCH /api/profiles/:id/password - admin reimposta password (deve essere prima di /:id)
router.patch('/:id/password', (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'Nuova password richiesta' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'La password deve essere di almeno 6 caratteri' });

  const target = db.prepare('SELECT id FROM profiles WHERE id = ?').get(id);
  if (!target) return res.status(404).json({ error: 'Utente non trovato' });

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE profiles SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, id);
  res.json({ ok: true });
});

// PATCH /api/profiles/:id - aggiorna profilo
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { fullName, role } = req.body;

  const updates = [];
  const params = [];
  if (req.body.fullName != null) { updates.push('full_name = ?'); params.push(req.body.fullName); }
  if (req.body.phone != null) { updates.push('phone = ?'); params.push(req.body.phone); }
  if (req.body.role != null) { updates.push('role = ?'); params.push(req.body.role); }
  if (updates.length === 0) return res.status(400).json({ error: 'Nessun campo da aggiornare' });

  params.push(id);
  db.prepare(`UPDATE profiles SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

// DELETE /api/profiles/:id - elimina utente (solo user/maestro, mai admin)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const target = db.prepare('SELECT id, role FROM profiles WHERE id = ?').get(id);
  if (!target) return res.status(404).json({ error: 'Utente non trovato' });
  if (target.role === 'admin') return res.status(403).json({ error: 'Non è possibile eliminare un amministratore' });
  // Riassegna eventi e presenze all'admin corrente prima di eliminare
  db.prepare('UPDATE events SET created_by = ? WHERE created_by = ?').run(req.user.id, id);
  db.prepare('UPDATE attendances SET marked_by = NULL WHERE marked_by = ?').run(id);
  db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
  res.json({ ok: true });
});

// POST /api/profiles - crea utente (admin)
router.post('/', (req, res) => {
  const { email, password, fullName, phone, role } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password e nome richiesti' });
  }

  const existing = db.prepare('SELECT id FROM profiles WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(400).json({ error: 'Email già registrata' });

  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO profiles (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, email.toLowerCase().trim(), hash, fullName.trim(), phone || null, role || 'user');

  const user = db.prepare('SELECT id, email, full_name, phone, role, created_at FROM profiles WHERE id = ?').get(id);
  res.status(201).json({ id: user.id, email: user.email, fullName: user.full_name, phone: user.phone, role: user.role, createdAt: user.created_at });
});

module.exports = router;
