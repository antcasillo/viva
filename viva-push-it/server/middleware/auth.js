/**
 * Middleware JWT per autenticazione
 */

const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'viva-push-it-secret-change-in-production';
const JWT_EXPIRES = '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token non valido o scaduto' });
  }

  const user = db.prepare('SELECT id, email, full_name, role, avatar_url, created_at FROM profiles WHERE id = ?').get(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'Utente non trovato' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
  };
  next();
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  next();
}

module.exports = { signToken, verifyToken, authMiddleware, adminOnly, JWT_SECRET };
