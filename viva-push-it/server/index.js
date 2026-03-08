/**
 * Server Express + SQLite per viva.push.it
 * Avvio: node server/index.js
 * Oppure: npm run server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const profilesRoutes = require('./routes/profiles');
const studentsRoutes = require('./routes/students');
const coursesRoutes = require('./routes/courses');
const enrollmentsRoutes = require('./routes/enrollments');
const attendancesRoutes = require('./routes/attendances');
const paymentsRoutes = require('./routes/payments');
const eventsRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// API
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/attendances', attendancesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/events', eventsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// In produzione: serve il frontend buildato
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`viva.push.it server in ascolto su http://localhost:${PORT}`);
});
