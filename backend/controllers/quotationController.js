const { query, getClient } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

const quotationItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
  description: z.string().optional(),
});

const quotationSchema = z.object({
  customer_id: z.string().uuid(),
  items: z.array(quotationItemSchema).min(1),
  discount_id: z.string().uuid().optional().nullable(),
  tax_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  expiry_date: z.string().optional().nullable(),
});

const generateQuotationNumber = async () => {
  const year = new Date().getFullYear();
  const res = await query(
    `SELECT COUNT(*) FROM quotations WHERE quotation_number LIKE $1`,
    [`QUO-${year}-%`]
  );
  const count = parseInt(res.rows[0].count) + 1;
  return `QUO-${year}-${String(count).padStart(4, '0')}`;
};

const calculateTotals = async (items, discountId, taxId) => {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.unit_price * item.quantity;
  }

  let discount_amount = 0;
  if (discountId) {
    const dr = await query('SELECT * FROM discount_rules WHERE id = $1 AND is_active = true', [discountId]);
    if (dr.rows.length) {
      const d = dr.rows[0];
      if (d.discount_type === 'percentage') {
        discount_amount = (subtotal * d.value) / 100;
      } else {
        discount_amount = Math.min(d.value, subtotal);
      }
    }
  }

  const taxable = subtotal - discount_amount;
  let tax_amount = 0;
  if (taxId) {
    const tr = await query('SELECT * FROM tax_rules WHERE id = $1 AND is_active = true', [taxId]);
    if (tr.rows.length) {
      const t = tr.rows[0];
      if (t.tax_type === 'percentage') {
        tax_amount = (taxable * t.rate) / 100;
      } else {
        tax_amount = t.rate;
      }
    }
  }

  const total = Math.max(0, taxable + tax_amount);
  return { subtotal, discount_amount, tax_amount, total };
};

const list = async (req, res, next) => {
  try {
    const { status, customer_id, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let sql = `SELECT q.*, c.name as customer_name, c.company_name, u.name as created_by_name
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      LEFT JOIN users u ON q.created_by = u.id
      WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (status) { sql += ` AND q.status = $${idx++}`; params.push(status); }
    if (customer_id) { sql += ` AND q.customer_id = $${idx++}`; params.push(customer_id); }
    if (search) { sql += ` AND (q.quotation_number ILIKE $${idx} OR c.name ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    sql += ` ORDER BY q.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));
    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const q = await query(
      `SELECT q.*, c.name as customer_name, c.company_name, c.email as customer_email, c.phone, c.billing_address, c.gst_number,
       u.name as created_by_name, d.name as discount_name, t.name as tax_name, t.rate as tax_rate
       FROM quotations q
       JOIN customers c ON q.customer_id = c.id
       LEFT JOIN users u ON q.created_by = u.id
       LEFT JOIN discount_rules d ON q.discount_id = d.id
       LEFT JOIN tax_rules t ON q.tax_id = t.id
       WHERE q.id = $1`,
      [id]
    );
    if (!q.rows.length) return res.status(404).json({ error: 'Quotation not found' });

    const items = await query(
      `SELECT qi.*, p.name as product_name, v.name as variant_name FROM quotation_items qi
       JOIN products p ON qi.product_id = p.id
       LEFT JOIN product_variants v ON qi.variant_id = v.id
       WHERE qi.quotation_id = $1`,
      [id]
    );

    res.json({ ...q.rows[0], items: items.rows });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const parsed = quotationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;

    const quotation_number = await generateQuotationNumber();
    const { subtotal, discount_amount, tax_amount, total } = await calculateTotals(d.items, d.discount_id, d.tax_id);

    const id = uuidv4();
    await client.query(
      `INSERT INTO quotations (id,quotation_number,customer_id,created_by,status,subtotal,discount_amount,tax_amount,total,discount_id,tax_id,notes,expiry_date)
       VALUES ($1,$2,$3,$4,'draft',$5,$6,$7,$8,$9,$10,$11,$12)`,
      [id, quotation_number, d.customer_id, req.user.id, subtotal, discount_amount, tax_amount, total,
       d.discount_id || null, d.tax_id || null, d.notes, d.expiry_date || null]
    );

    for (const item of d.items) {
      await client.query(
        `INSERT INTO quotation_items (id,quotation_id,product_id,variant_id,quantity,unit_price,total_price,description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [uuidv4(), id, item.product_id, item.variant_id || null, item.quantity, item.unit_price, item.unit_price * item.quantity, item.description]
      );
    }

    await client.query('COMMIT');
    const result = await query('SELECT * FROM quotations WHERE id = $1', [id]);
    res.status(201).json(result.rows[0]);
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
    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await query(
      'UPDATE quotations SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Quotation not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const convertToSubscription = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { plan_id, billing_frequency, start_date, payment_terms, tax_id } = req.body;

    const qRes = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
    if (!qRes.rows.length) return res.status(404).json({ error: 'Quotation not found' });
    const q = qRes.rows[0];
    if (q.status !== 'accepted') return res.status(400).json({ error: 'Only accepted quotations can be converted' });

    // Get items
    const items = await client.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [id]);

    // Generate subscription number
    const year = new Date().getFullYear();
    const countRes = await client.query(`SELECT COUNT(*) FROM subscriptions WHERE subscription_number LIKE $1`, [`SUB-${year}-%`]);
    const subNum = `SUB-${year}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0')}`;

    const subId = uuidv4();
    const startDate = start_date || new Date().toISOString().split('T')[0];
    const freq = billing_frequency || 'monthly';

    await client.query(
      `INSERT INTO subscriptions (id,subscription_number,customer_id,plan_id,quotation_id,created_by,status,billing_frequency,start_date,next_billing_date,payment_terms,recurring_amount,discount_id,tax_id,notes)
       VALUES ($1,$2,$3,$4,$5,$6,'confirmed',$7,$8,$8,$9,$10,$11,$12,$13)`,
      [subId, subNum, q.customer_id, plan_id || null, id, req.user.id, freq, startDate, payment_terms || 30, q.total, q.discount_id, tax_id || q.tax_id, q.notes]
    );

    for (const item of items.rows) {
      await client.query(
        `INSERT INTO subscription_items (id,subscription_id,product_id,variant_id,quantity,unit_price,total_price) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [uuidv4(), subId, item.product_id, item.variant_id, item.quantity, item.unit_price, item.total_price]
      );
    }

    await client.query('UPDATE quotations SET status = $1, converted_subscription_id = $2 WHERE id = $3', ['converted', subId, id]);
    await client.query('COMMIT');

    res.status(201).json({ subscription_id: subId, subscription_number: subNum });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { list, getById, create, updateStatus, convertToSubscription };
