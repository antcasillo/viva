/**
 * Route pagamenti
 */

const express = require('express');
const { db, uuid } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function toPayment(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    amount: row.amount,
    description: row.description,
    dueDate: row.due_date,
    status: row.status,
    paidAt: row.paid_at,
    paymentReference: row.payment_reference,
    createdAt: row.created_at,
  };
}

// GET /api/payments
router.get('/', (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = db.prepare('SELECT * FROM payments ORDER BY due_date DESC').all();
  } else {
    rows = db.prepare(
      `SELECT p.* FROM payments p
       JOIN students s ON s.id = p.student_id
       WHERE s.user_id = ?`
    ).all(req.user.id);
    rows.sort((a, b) => b.due_date.localeCompare(a.due_date));
  }
  res.json(rows.map(toPayment));
});

// POST /api/payments (solo admin)
router.post('/', adminOnly, (req, res) => {
  const { studentId, amount, description, dueDate, status } = req.body;
  if (!studentId || amount == null || !description || !dueDate)
    return res.status(400).json({ error: 'studentId, amount, description, dueDate richiesti' });

  const id = uuid();
  db.prepare(
    `INSERT INTO payments (id, student_id, amount, description, due_date, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, studentId, amount, description, dueDate, status || 'pending');

  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  res.status(201).json(toPayment(row));
});

// PATCH /api/payments/:id (admin)
router.patch('/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const { studentId, amount, description, dueDate, status, paymentReference } = req.body;

  const updates = [];
  const params = [];
  if (studentId != null) { updates.push('student_id = ?'); params.push(studentId); }
  if (amount != null) { updates.push('amount = ?'); params.push(amount); }
  if (description != null) { updates.push('description = ?'); params.push(description); }
  if (dueDate != null) { updates.push('due_date = ?'); params.push(dueDate); }
  if (status != null) {
    updates.push('status = ?');
    params.push(status);
    if (status === 'paid') {
      updates.push('paid_at = ?');
      params.push(new Date().toISOString());
    }
  }
  if (paymentReference != null) { updates.push('payment_reference = ?'); params.push(paymentReference); }
  if (updates.length === 0) return res.status(400).json({ error: 'Nessun campo da aggiornare' });

  params.push(id);
  db.prepare(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Pagamento non trovato' });
  res.json(toPayment(row));
});

// DELETE /api/payments/:id (solo admin)
router.delete('/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const r = db.prepare('DELETE FROM payments WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Pagamento non trovato' });
  res.json({ ok: true });
});

module.exports = router;
