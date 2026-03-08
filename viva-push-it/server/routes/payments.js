/**
 * Route pagamenti
 */

const express = require('express');
const { db } = require('../db');
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

// PATCH /api/payments/:id - aggiorna status (admin)
router.patch('/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const { status, paymentReference } = req.body;
  if (!status) return res.status(400).json({ error: 'status richiesto' });

  const updates = ['status = ?'];
  const params = [status];
  if (status === 'paid') {
    updates.push('paid_at = ?');
    params.push(new Date().toISOString());
    if (paymentReference) {
      updates.push('payment_reference = ?');
      params.push(paymentReference);
    }
  }
  params.push(id);
  db.prepare(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  res.json(toPayment(row));
});

module.exports = router;
