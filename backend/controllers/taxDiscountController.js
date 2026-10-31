const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

// TAX RULES
const taxSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tax_type: z.enum(['percentage', 'fixed']).default('percentage'),
  rate: z.number().min(0),
});

const listTaxes = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM tax_rules ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { next(err); }
};

const createTax = async (req, res, next) => {
  try {
    const parsed = taxSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;
    const id = uuidv4();
    const result = await query(
      `INSERT INTO tax_rules (id,name,description,tax_type,rate) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, d.name, d.description, d.tax_type, d.rate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

const updateTax = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = taxSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;
    const fields = Object.keys(d);
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = [id, ...fields.map(f => d[f])];
    const result = await query(`UPDATE tax_rules SET ${setClauses} WHERE id = $1 RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Tax rule not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const toggleTax = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE tax_rules SET is_active = NOT is_active WHERE id = $1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Tax rule not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DISCOUNT RULES
const discountSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
  min_purchase_amount: z.number().min(0).optional(),
  min_quantity: z.number().int().min(0).optional(),
  max_uses: z.number().int().positive().optional().nullable(),
  product_id: z.string().uuid().optional().nullable(),
  valid_from: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
});

const listDiscounts = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT d.*, p.name as product_name FROM discount_rules d LEFT JOIN products p ON d.product_id = p.id ORDER BY d.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const createDiscount = async (req, res, next) => {
  try {
    const parsed = discountSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;
    const id = uuidv4();
    const result = await query(
      `INSERT INTO discount_rules (id,name,description,discount_type,value,min_purchase_amount,min_quantity,max_uses,product_id,valid_from,valid_until,code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [id, d.name, d.description, d.discount_type, d.value, d.min_purchase_amount || 0, d.min_quantity || 0,
       d.max_uses || null, d.product_id || null, d.valid_from || null, d.valid_until || null, d.code || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

const updateDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = discountSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const d = parsed.data;
    const fields = Object.keys(d);
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = [id, ...fields.map(f => d[f])];
    const result = await query(`UPDATE discount_rules SET ${setClauses} WHERE id = $1 RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Discount not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const toggleDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE discount_rules SET is_active = NOT is_active WHERE id = $1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Discount not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const validateDiscount = async (req, res, next) => {
  try {
    const { code, amount, quantity } = req.body;
    const result = await query(
      `SELECT * FROM discount_rules WHERE code = $1 AND is_active = true AND (valid_from IS NULL OR valid_from <= NOW()) AND (valid_until IS NULL OR valid_until >= NOW())`,
      [code]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Invalid or expired discount code' });
    const d = result.rows[0];

    if (d.max_uses && d.current_uses >= d.max_uses) {
      return res.status(400).json({ error: 'Discount usage limit reached' });
    }
    if (d.min_purchase_amount && amount < d.min_purchase_amount) {
      return res.status(400).json({ error: `Minimum purchase amount ₹${d.min_purchase_amount} required` });
    }
    if (d.min_quantity && quantity < d.min_quantity) {
      return res.status(400).json({ error: `Minimum quantity ${d.min_quantity} required` });
    }

    let discount_amount = d.discount_type === 'percentage' ? (amount * d.value) / 100 : Math.min(d.value, amount);
    res.json({ discount: d, discount_amount });
  } catch (err) { next(err); }
};

module.exports = {
  listTaxes, createTax, updateTax, toggleTax,
  listDiscounts, createDiscount, updateDiscount, toggleDiscount, validateDiscount
};
