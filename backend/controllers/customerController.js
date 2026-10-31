const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

const customerSchema = z.object({
  name: z.string().min(1).max(255),
  company_name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  billing_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  gst_number: z.string().optional(),
  tax_number: z.string().optional(),
  notes: z.string().optional(),
});

const list = async (req, res, next) => {
  try {
    const { search, is_active, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let sql = `SELECT c.*, u.email as user_email,
      (SELECT COUNT(*) FROM subscriptions s WHERE s.customer_id = c.id) as subscription_count,
      (SELECT COUNT(*) FROM invoices i WHERE i.customer_id = c.id) as invoice_count
      FROM customers c LEFT JOIN users u ON c.user_id = u.id WHERE 1=1`;
    const params = [];
    let idx = 1;

    // Customers can only see themselves
    if (req.user.role === 'customer') {
      sql += ` AND c.user_id = $${idx++}`;
      params.push(req.user.id);
    }

    if (search) {
      sql += ` AND (c.name ILIKE $${idx} OR c.email ILIKE $${idx} OR c.company_name ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (is_active !== undefined) {
      sql += ` AND c.is_active = $${idx++}`;
      params.push(is_active === 'true');
    }
    sql += ` ORDER BY c.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));

    const result = await query(sql, params);

    // Count
    let countSql = 'SELECT COUNT(*) FROM customers c WHERE 1=1';
    const countParams = [];
    let cidx = 1;
    if (req.user.role === 'customer') { countSql += ` AND c.user_id = $${cidx++}`; countParams.push(req.user.id); }
    if (search) { countSql += ` AND (c.name ILIKE $${cidx} OR c.email ILIKE $${cidx} OR c.company_name ILIKE $${cidx})`; countParams.push(`%${search}%`); cidx++; }
    const countRes = await query(countSql, countParams);

    res.json({ data: result.rows, total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let sql = `SELECT c.*, u.email as user_email FROM customers c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = $1`;
    const params = [id];

    const result = await query(sql, params);
    if (!result.rows.length) return res.status(404).json({ error: 'Customer not found' });

    const customer = result.rows[0];
    // Ownership check for customer role
    if (req.user.role === 'customer' && customer.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get subscriptions
    const subs = await query(
      `SELECT s.*, p.name as plan_name FROM subscriptions s LEFT JOIN plans p ON s.plan_id = p.id WHERE s.customer_id = $1 ORDER BY s.created_at DESC`,
      [id]
    );

    // Get invoices
    const invs = await query(
      `SELECT id, invoice_number, status, total, amount_paid, outstanding_balance, due_date, created_at FROM invoices WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    // Get payments
    const pays = await query(
      `SELECT p.*, i.invoice_number FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE p.customer_id = $1 ORDER BY p.payment_date DESC LIMIT 10`,
      [id]
    );

    res.json({ ...customer, subscriptions: subs.rows, invoices: invs.rows, payments: pays.rows });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const parsed = customerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;

    const exists = await query('SELECT id FROM customers WHERE email = $1', [d.email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Customer with this email already exists' });

    const id = uuidv4();
    const result = await query(
      `INSERT INTO customers (id,name,company_name,email,phone,billing_address,city,state,country,pincode,gst_number,tax_number,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [id, d.name, d.company_name, d.email, d.phone, d.billing_address, d.city, d.state, d.country || 'India', d.pincode, d.gst_number, d.tax_number, d.notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = customerSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;

    // Check ownership if customer
    if (req.user.role === 'customer') {
      const check = await query('SELECT user_id FROM customers WHERE id = $1', [id]);
      if (!check.rows.length || check.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const fields = Object.keys(d);
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = [id, ...fields.map(f => d[f])];

    const result = await query(
      `UPDATE customers SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE customers SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, email, is_active',
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, toggleStatus };
