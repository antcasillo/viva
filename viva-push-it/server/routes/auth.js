/**
 * Route autenticazione
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { db, uuid } = require('../db');
const { signToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password richiesti' });
  }

  const user = db.prepare('SELECT id, email, password_hash, full_name, phone, role, avatar_url, created_at FROM profiles WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Email o password non corretti' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Email o password non corretti' });
  }

  const token = signToken({ userId: user.id });
  const profile = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
  };

  res.json({ success: true, user: profile, token });
});

// GET /api/auth/me - profilo corrente (richiede auth)
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/register - registrazione (opzionale, per nuovi utenti)
router.post('/register', (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password e nome richiesti' });
  }

  const existing = db.prepare('SELECT id FROM profiles WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'Email già registrata' });
  }

  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO profiles (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, email.toLowerCase().trim(), hash, fullName.trim(), req.body.phone || null, 'user');

  const user = db.prepare('SELECT id, email, full_name, phone, role, created_at FROM profiles WHERE id = ?').get(id);
  const token = signToken({ userId: id });
  res.status(201).json({
    success: true,
    user: { id: user.id, email: user.email, fullName: user.full_name, phone: user.phone, role: user.role, createdAt: user.created_at },
    token,
  });
});

module.exports = router;
