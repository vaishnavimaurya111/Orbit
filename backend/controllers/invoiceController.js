const { query, getClient } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

const list = async (req, res, next) => {
  try {
    const { status, customer_id, subscription_id, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let sql = `SELECT i.*, c.name as customer_name, c.company_name, s.subscription_number
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (req.user.role === 'customer') {
      sql += ` AND c.user_id = $${idx++}`;
      params.push(req.user.id);
    }
    if (status) { sql += ` AND i.status = $${idx++}`; params.push(status); }
    if (customer_id) { sql += ` AND i.customer_id = $${idx++}`; params.push(customer_id); }
    if (subscription_id) { sql += ` AND i.subscription_id = $${idx++}`; params.push(subscription_id); }
    if (search) { sql += ` AND (i.invoice_number ILIKE $${idx} OR c.name ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    sql += ` ORDER BY i.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));

    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inv = await query(
      `SELECT i.*, c.name as customer_name, c.company_name, c.email as customer_email, c.phone, c.billing_address, c.city, c.state, c.country, c.gst_number,
       s.subscription_number, d.name as discount_name, t.name as tax_name, t.rate as tax_rate
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       LEFT JOIN subscriptions s ON i.subscription_id = s.id
       LEFT JOIN discount_rules d ON i.discount_id = d.id
       LEFT JOIN tax_rules t ON i.tax_id = t.id
       WHERE i.id = $1`,
      [id]
    );
    if (!inv.rows.length) return res.status(404).json({ error: 'Invoice not found' });

    const invoice = inv.rows[0];
    if (req.user.role === 'customer') {
      const check = await query('SELECT user_id FROM customers WHERE id = $1', [invoice.customer_id]);
      if (!check.rows.length || check.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const items = await query(
      `SELECT ii.*, p.name as product_name, v.name as variant_name FROM invoice_items ii
       LEFT JOIN products p ON ii.product_id = p.id
       LEFT JOIN product_variants v ON ii.variant_id = v.id
       WHERE ii.invoice_id = $1`,
      [id]
    );

    const payments = await query(
      `SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC`,
      [id]
    );

    res.json({ ...invoice, items: items.rows, payments: payments.rows });
  } catch (err) { next(err); }
};

const createManual = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { customer_id, items, discount_id, tax_id, notes, due_date } = req.body;

    if (!customer_id || !items?.length) return res.status(400).json({ error: 'Customer and items required' });

    const year = new Date().getFullYear();
    const countRes = await client.query(`SELECT COUNT(*) FROM invoices WHERE invoice_number LIKE $1`, [`INV-${year}-%`]);
    const invNum = `INV-${year}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0')}`;

    let subtotal = 0;
    for (const item of items) subtotal += item.unit_price * item.quantity;

    let discount_amount = 0;
    if (discount_id) {
      const dr = await client.query('SELECT * FROM discount_rules WHERE id = $1 AND is_active = true', [discount_id]);
      if (dr.rows.length) {
        const d = dr.rows[0];
        discount_amount = d.discount_type === 'percentage' ? (subtotal * d.value) / 100 : Math.min(d.value, subtotal);
      }
    }

    let tax_amount = 0;
    if (tax_id) {
      const tr = await client.query('SELECT * FROM tax_rules WHERE id = $1 AND is_active = true', [tax_id]);
      if (tr.rows.length) {
        const t = tr.rows[0];
        const taxable = subtotal - discount_amount;
        tax_amount = t.tax_type === 'percentage' ? (taxable * t.rate) / 100 : parseFloat(t.rate);
      }
    }

    const total = Math.max(0, subtotal - discount_amount + tax_amount);
    const id = uuidv4();

    await client.query(
      `INSERT INTO invoices (id,invoice_number,customer_id,created_by,invoice_type,status,subtotal,discount_amount,tax_amount,total,amount_paid,outstanding_balance,discount_id,tax_id,notes,due_date)
       VALUES ($1,$2,$3,$4,'manual','confirmed',$5,$6,$7,$8,0,$8,$9,$10,$11,$12)`,
      [id, invNum, customer_id, req.user.id, subtotal, discount_amount, tax_amount, total, discount_id || null, tax_id || null, notes, due_date || null]
    );

    for (const item of items) {
      await client.query(
        `INSERT INTO invoice_items (id,invoice_id,product_id,variant_id,description,quantity,unit_price,total_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [uuidv4(), id, item.product_id || null, item.variant_id || null, item.description, item.quantity, item.unit_price, item.unit_price * item.quantity]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id, invoice_number: invNum, total });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['draft', 'confirmed', 'partially_paid', 'paid', 'overdue', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const result = await query('UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

module.exports = { list, getById, createManual, updateStatus };
