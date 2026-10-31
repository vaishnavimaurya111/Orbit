const { query, getClient } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

const paymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_method: z.enum(['cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other']),
  payment_date: z.string().optional(),
  notes: z.string().optional(),
});

const list = async (req, res, next) => {
  try {
    const { customer_id, invoice_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let sql = `SELECT p.*, i.invoice_number, c.name as customer_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON p.customer_id = c.id
      WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (req.user.role === 'customer') {
      sql += ` AND c.user_id = $${idx++}`;
      params.push(req.user.id);
    }
    if (customer_id) { sql += ` AND p.customer_id = $${idx++}`; params.push(customer_id); }
    if (invoice_id) { sql += ` AND p.invoice_id = $${idx++}`; params.push(invoice_id); }
    sql += ` ORDER BY p.payment_date DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));

    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};

const record = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;

    // Lock invoice
    const invRes = await client.query('SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [d.invoice_id]);
    if (!invRes.rows.length) return res.status(404).json({ error: 'Invoice not found' });
    const invoice = invRes.rows[0];

    if (invoice.status === 'paid') return res.status(400).json({ error: 'Invoice is already fully paid' });
    if (invoice.status === 'cancelled') return res.status(400).json({ error: 'Invoice is cancelled' });

    const outstanding = parseFloat(invoice.outstanding_balance);
    if (d.amount > outstanding + 0.01) {
      return res.status(400).json({ error: `Payment amount ₹${d.amount} exceeds outstanding balance ₹${outstanding}` });
    }

    const newPaid = parseFloat(invoice.amount_paid) + d.amount;
    const newBalance = Math.max(0, parseFloat(invoice.total) - newPaid);
    const newStatus = newBalance < 0.01 ? 'paid' : 'partially_paid';

    await client.query(
      'UPDATE invoices SET amount_paid = $1, outstanding_balance = $2, status = $3 WHERE id = $4',
      [newPaid, newBalance, newStatus, d.invoice_id]
    );

    const year = new Date().getFullYear();
    const countRes = await client.query(`SELECT COUNT(*) FROM payments WHERE payment_reference LIKE $1`, [`PAY-${year}-%`]);
    const payRef = `PAY-${year}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0')}`;

    const payId = uuidv4();
    await client.query(
      `INSERT INTO payments (id,payment_reference,invoice_id,customer_id,recorded_by,amount,payment_method,payment_date,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [payId, payRef, d.invoice_id, invoice.customer_id, req.user.id, d.amount, d.payment_method,
       d.payment_date || new Date().toISOString().split('T')[0], d.notes]
    );

    await client.query(
      `INSERT INTO audit_logs (user_id,action,entity_type,entity_id,new_values) VALUES ($1,'PAYMENT_RECORDED','invoice',$2,$3)`,
      [req.user.id, d.invoice_id, JSON.stringify({ amount: d.amount, method: d.payment_method, reference: payRef })]
    );

    await client.query('COMMIT');
    res.status(201).json({ payment_reference: payRef, amount: d.amount, new_status: newStatus, outstanding_balance: newBalance });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { list, record };
