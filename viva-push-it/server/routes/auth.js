/**
 * Route autenticazione
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, uuid } = require('../db');
const { signToken, authMiddleware } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '..', '..', 'data', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = (file.originalname.match(/\.(jpe?g|png|gif|webp)$/i) || ['.jpg'])[1]?.toLowerCase() || 'jpg';
    cb(null, `${req.user.id}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpe?g|png|gif|webp)$/i.test(file.originalname) || file.mimetype?.startsWith('image/');
    cb(ok ? null : new Error('Solo immagini (jpg, png, gif, webp)'), ok);
  },
});

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const login = (email || '').trim();
  if (!login || !password) {
    return res.status(400).json({ error: 'Email/username e password richiesti' });
  }

  // Login con username o email (admin può usare "admin")
  const user = db.prepare(
    `SELECT id, email, password_hash, full_name, phone, role, avatar_url, created_at FROM profiles 
     WHERE (username = ? OR email = ?)`
  ).get(login.toLowerCase(), login.toLowerCase());
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

// PATCH /api/auth/profile - aggiorna nome e telefono del proprio profilo
router.patch('/profile', authMiddleware, (req, res) => {
  const { fullName, phone } = req.body;
  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    return res.status(400).json({ error: 'Nome richiesto' });
  }
  db.prepare(
    'UPDATE profiles SET full_name = ?, phone = ? WHERE id = ?'
  ).run(fullName.trim(), phone != null ? String(phone).trim() || null : null, req.user.id);
  const updated = db.prepare(
    'SELECT id, email, full_name, phone, role, avatar_url, created_at FROM profiles WHERE id = ?'
  ).get(req.user.id);
  res.json({
    user: {
      id: updated.id,
      email: updated.email,
      fullName: updated.full_name,
      phone: updated.phone,
      role: updated.role,
      avatarUrl: updated.avatar_url,
      createdAt: updated.created_at,
    },
  });
});

// POST /api/auth/change-password - cambia la propria password (richiede auth)
router.post('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Password attuale e nuova password richieste' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La nuova password deve essere di almeno 6 caratteri' });
  }

  const user = db.prepare('SELECT id, password_hash FROM profiles WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'Utente non trovato' });

  const valid = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Password attuale non corretta' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE profiles SET password_hash = ?, updated_at = datetime("now") WHERE id = ?').run(hash, req.user.id);
  res.json({ ok: true });
});

// POST /api/auth/avatar - carica/modifica foto profilo
router.post('/avatar', authMiddleware, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Errore upload' });
    next();
  });
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });

  const userId = req.user.id;
  const ext = path.extname(req.file.filename);
  const avatarPath = `/uploads/avatars/${userId}${ext}`;

  const current = db.prepare('SELECT avatar_url FROM profiles WHERE id = ?').get(userId);
  if (current?.avatar_url) {
    const oldPath = path.join(uploadsDir, path.basename(current.avatar_url));
    try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (_) {}
  }

  db.prepare('UPDATE profiles SET avatar_url = ?, updated_at = datetime("now") WHERE id = ?').run(avatarPath, userId);
  res.json({ ok: true, avatarUrl: avatarPath });
});

// DELETE /api/auth/avatar - rimuovi foto profilo
router.delete('/avatar', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const current = db.prepare('SELECT avatar_url FROM profiles WHERE id = ?').get(userId);
  if (current?.avatar_url) {
    const filePath = path.join(uploadsDir, path.basename(current.avatar_url));
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
  }
  db.prepare('UPDATE profiles SET avatar_url = NULL, updated_at = datetime("now") WHERE id = ?').run(userId);
  res.json({ ok: true });
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
