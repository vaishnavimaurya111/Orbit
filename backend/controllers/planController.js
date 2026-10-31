const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

const planSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  billing_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  min_quantity: z.number().int().min(1).default(1),
  available_from: z.string().optional().nullable(),
  available_until: z.string().optional().nullable(),
  allow_pause: z.boolean().default(true),
  allow_early_cancellation: z.boolean().default(true),
  auto_close_on_end: z.boolean().default(false),
  setup_fee: z.number().min(0).default(0),
  products: z.array(z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().optional().nullable(),
    quantity: z.number().int().min(1).default(1),
    unit_price: z.number().min(0),
  })).optional(),
});

const list = async (req, res, next) => {
  try {
    const { search, is_active } = req.query;
    let sql = `SELECT p.*,
      (SELECT COUNT(*) FROM plan_products pp WHERE pp.plan_id = p.id) as product_count
      FROM plans p WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (search) { sql += ` AND p.name ILIKE $${idx}`; params.push(`%${search}%`); idx++; }
    if (is_active !== undefined) { sql += ` AND p.is_active = $${idx++}`; params.push(is_active === 'true'); }
    sql += ' ORDER BY p.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await query('SELECT * FROM plans WHERE id = $1', [id]);
    if (!plan.rows.length) return res.status(404).json({ error: 'Plan not found' });

    const products = await query(
      `SELECT pp.*, p.name as product_name, p.sales_price as product_price, p.product_type,
       v.name as variant_name, v.additional_price as variant_price
       FROM plan_products pp
       JOIN products p ON pp.product_id = p.id
       LEFT JOIN product_variants v ON pp.variant_id = v.id
       WHERE pp.plan_id = $1`,
      [id]
    );

    res.json({ ...plan.rows[0], products: products.rows });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const parsed = planSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;
    const id = uuidv4();

    const result = await query(
      `INSERT INTO plans (id,name,description,billing_frequency,min_quantity,available_from,available_until,allow_pause,allow_early_cancellation,auto_close_on_end,setup_fee)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id, d.name, d.description, d.billing_frequency, d.min_quantity, d.available_from, d.available_until,
       d.allow_pause, d.allow_early_cancellation, d.auto_close_on_end, d.setup_fee]
    );

    // Insert plan products
    if (d.products && d.products.length) {
      for (const pp of d.products) {
        await query(
          `INSERT INTO plan_products (id,plan_id,product_id,variant_id,quantity,unit_price) VALUES ($1,$2,$3,$4,$5,$6)`,
          [uuidv4(), id, pp.product_id, pp.variant_id || null, pp.quantity, pp.unit_price]
        );
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = planSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;

    const { products, ...planData } = d;
    const fields = Object.keys(planData);

    if (fields.length) {
      const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
      const values = [id, ...fields.map(f => planData[f])];
      await query(`UPDATE plans SET ${setClauses} WHERE id = $1`, values);
    }

    // Update products if provided
    if (products) {
      await query('DELETE FROM plan_products WHERE plan_id = $1', [id]);
      for (const pp of products) {
        await query(
          `INSERT INTO plan_products (id,plan_id,product_id,variant_id,quantity,unit_price) VALUES ($1,$2,$3,$4,$5,$6)`,
          [uuidv4(), id, pp.product_id, pp.variant_id || null, pp.quantity, pp.unit_price]
        );
      }
    }

    const result = await query('SELECT * FROM plans WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Plan not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE plans SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active',
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Plan not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, toggleStatus };
