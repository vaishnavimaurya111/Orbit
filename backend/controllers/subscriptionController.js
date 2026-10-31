const { query, getClient } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

const subscriptionSchema = z.object({
  customer_id: z.string().uuid(),
  plan_id: z.string().uuid().optional().nullable(),
  billing_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.string(),
  end_date: z.string().optional().nullable(),
  payment_terms: z.number().int().min(0).default(30),
  discount_id: z.string().uuid().optional().nullable(),
  tax_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().optional().nullable(),
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0),
  })).min(1),
});

const generateSubNumber = async (client) => {
  const year = new Date().getFullYear();
  const res = await (client || query)(
    client ? { text: `SELECT COUNT(*) FROM subscriptions WHERE subscription_number LIKE $1`, values: [`SUB-${year}-%`] }
           : `SELECT COUNT(*) FROM subscriptions WHERE subscription_number LIKE $1`,
    client ? undefined : [`SUB-${year}-%`]
  );
  // Handle both client.query and direct query
  const rows = res.rows || [];
  const count = parseInt(rows[0]?.count || 0) + 1;
  return `SUB-${year}-${String(count).padStart(4, '0')}`;
};

const addBillingPeriod = (date, freq) => {
  const d = new Date(date);
  switch (freq) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split('T')[0];
};

const list = async (req, res, next) => {
  try {
    const { status, customer_id, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let sql = `SELECT s.*, c.name as customer_name, c.company_name, p.name as plan_name
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (req.user.role === 'customer') {
      sql += ` AND c.user_id = $${idx++}`;
      params.push(req.user.id);
    }
    if (status) { sql += ` AND s.status = $${idx++}`; params.push(status); }
    if (customer_id) { sql += ` AND s.customer_id = $${idx++}`; params.push(customer_id); }
    if (search) { sql += ` AND (s.subscription_number ILIKE $${idx} OR c.name ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    sql += ` ORDER BY s.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));

    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sub = await query(
      `SELECT s.*, c.name as customer_name, c.company_name, c.email as customer_email, c.phone, c.gst_number,
       p.name as plan_name, p.billing_frequency as plan_frequency,
       u.name as created_by_name, d.name as discount_name, t.name as tax_name, t.rate as tax_rate
       FROM subscriptions s
       JOIN customers c ON s.customer_id = c.id
       LEFT JOIN plans p ON s.plan_id = p.id
       LEFT JOIN users u ON s.created_by = u.id
       LEFT JOIN discount_rules d ON s.discount_id = d.id
       LEFT JOIN tax_rules t ON s.tax_id = t.id
       WHERE s.id = $1`,
      [id]
    );
    if (!sub.rows.length) return res.status(404).json({ error: 'Subscription not found' });

    const customer = sub.rows[0];
    if (req.user.role === 'customer') {
      const check = await query('SELECT user_id FROM customers WHERE id = $1', [customer.customer_id]);
      if (!check.rows.length || check.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const items = await query(
      `SELECT si.*, p.name as product_name, v.name as variant_name FROM subscription_items si
       JOIN products p ON si.product_id = p.id
       LEFT JOIN product_variants v ON si.variant_id = v.id
       WHERE si.subscription_id = $1`,
      [id]
    );

    const invoices = await query(
      `SELECT id, invoice_number, status, total, amount_paid, outstanding_balance, due_date, billing_period_start, billing_period_end, created_at
       FROM invoices WHERE subscription_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    const logs = await query(
      `SELECT al.*, u.name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id
       WHERE al.entity_type = 'subscription' AND al.entity_id = $1 ORDER BY al.created_at DESC LIMIT 20`,
      [id]
    );

    res.json({ ...customer, items: items.rows, invoices: invoices.rows, activity: logs.rows });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const parsed = subscriptionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;

    const year = new Date().getFullYear();
    const countRes = await client.query(`SELECT COUNT(*) FROM subscriptions WHERE subscription_number LIKE $1`, [`SUB-${year}-%`]);
    const subNum = `SUB-${year}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0')}`;

    const subTotal = d.items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
    const id = uuidv4();

    await client.query(
      `INSERT INTO subscriptions (id,subscription_number,customer_id,plan_id,created_by,status,billing_frequency,start_date,end_date,next_billing_date,payment_terms,recurring_amount,discount_id,tax_id,notes)
       VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$7,$9,$10,$11,$12,$13)`,
      [id, subNum, d.customer_id, d.plan_id || null, req.user.id, d.billing_frequency, d.start_date, d.end_date || null, d.payment_terms, subTotal, d.discount_id || null, d.tax_id || null, d.notes]
    );

    for (const item of d.items) {
      await client.query(
        `INSERT INTO subscription_items (id,subscription_id,product_id,variant_id,quantity,unit_price,total_price) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [uuidv4(), id, item.product_id, item.variant_id || null, item.quantity, item.unit_price, item.unit_price * item.quantity]
      );
    }

    await client.query('COMMIT');
    const result = await query('SELECT * FROM subscriptions WHERE id = $1', [id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const transition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // activate, pause, resume, close, renew

    const sub = await query('SELECT * FROM subscriptions WHERE id = $1', [id]);
    if (!sub.rows.length) return res.status(404).json({ error: 'Subscription not found' });
    const s = sub.rows[0];

    let newStatus = s.status;
    let extra = {};

    switch (action) {
      case 'confirm':
        if (!['draft', 'quotation'].includes(s.status)) return res.status(400).json({ error: 'Can only confirm draft/quotation subscriptions' });
        newStatus = 'confirmed';
        break;
      case 'activate':
        if (!['confirmed', 'paused'].includes(s.status)) return res.status(400).json({ error: 'Can only activate confirmed or paused subscriptions' });
        newStatus = 'active';
        if (!s.next_billing_date) extra.next_billing_date = s.start_date;
        extra.paused_at = null;
        break;
      case 'pause':
        if (s.status !== 'active') return res.status(400).json({ error: 'Can only pause active subscriptions' });
        newStatus = 'paused';
        extra.paused_at = new Date().toISOString();
        extra.next_billing_date = null;
        break;
      case 'resume':
        if (s.status !== 'paused') return res.status(400).json({ error: 'Can only resume paused subscriptions' });
        newStatus = 'active';
        extra.paused_at = null;
        extra.next_billing_date = new Date().toISOString().split('T')[0];
        break;
      case 'close':
        if (['closed'].includes(s.status)) return res.status(400).json({ error: 'Already closed' });
        newStatus = 'closed';
        extra.closed_at = new Date().toISOString();
        extra.next_billing_date = null;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const updates = { status: newStatus, ...extra };
    const fields = Object.keys(updates);
    const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    await query(`UPDATE subscriptions SET ${setClauses} WHERE id = $1`, [id, ...fields.map(f => updates[f])]);

    // Log
    await query(
      `INSERT INTO audit_logs (user_id,action,entity_type,entity_id,old_values,new_values) VALUES ($1,$2,'subscription',$3,$4,$5)`,
      [req.user.id, action.toUpperCase(), id, JSON.stringify({ status: s.status }), JSON.stringify({ status: newStatus })]
    );

    const result = await query('SELECT * FROM subscriptions WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, transition, addBillingPeriod };
