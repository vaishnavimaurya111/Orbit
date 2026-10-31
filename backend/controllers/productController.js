const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

const productSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  product_type: z.enum(['service', 'physical', 'digital']).default('service'),
  sales_price: z.number().min(0),
  cost_price: z.number().min(0).optional(),
  unit: z.string().optional(),
  sku: z.string().optional(),
});

const variantSchema = z.object({
  name: z.string().min(1),
  additional_price: z.number().min(0).default(0),
  sku: z.string().optional(),
  description: z.string().optional(),
});

const list = async (req, res, next) => {
  try {
    const { search, is_active, is_archived, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let sql = `SELECT p.*,
      (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = true) as variant_count
      FROM products p WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (search) { sql += ` AND (p.name ILIKE $${idx} OR p.sku ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (is_active !== undefined) { sql += ` AND p.is_active = $${idx++}`; params.push(is_active === 'true'); }
    if (is_archived !== undefined) { sql += ` AND p.is_archived = $${idx++}`; params.push(is_archived === 'true'); }
    else { sql += ` AND p.is_archived = false`; }

    sql += ` ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));

    const result = await query(sql, params);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (!product.rows.length) return res.status(404).json({ error: 'Product not found' });

    const variants = await query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC', [id]);
    res.json({ ...product.rows[0], variants: variants.rows });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;
    const id = uuidv4();
    const result = await query(
      `INSERT INTO products (id,name,description,product_type,sales_price,cost_price,unit,sku) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, d.name, d.description, d.product_type, d.sales_price, d.cost_price || 0, d.unit || 'unit', d.sku]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;
    const fields = Object.keys(d);
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = [id, ...fields.map(f => d[f])];
    const result = await query(`UPDATE products SET ${setClauses} WHERE id = $1 RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const archive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE products SET is_archived = NOT is_archived WHERE id = $1 RETURNING id, name, is_archived',
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// Variants
const listVariants = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const result = await query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC', [productId]);
    res.json(result.rows);
  } catch (err) { next(err); }
};

const createVariant = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const parsed = variantSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;
    const id = uuidv4();
    const result = await query(
      `INSERT INTO product_variants (id,product_id,name,additional_price,sku,description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, productId, d.name, d.additional_price, d.sku, d.description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

const updateVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = variantSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;
    const fields = Object.keys(d);
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = [id, ...fields.map(f => d[f])];
    const result = await query(`UPDATE product_variants SET ${setClauses} WHERE id = $1 RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Variant not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, archive, listVariants, createVariant, updateVariant };
