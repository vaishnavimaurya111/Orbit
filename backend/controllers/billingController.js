const { query, getClient } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

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

const generateInvoiceNumber = async (client) => {
  const year = new Date().getFullYear();
  const res = await client.query(
    `SELECT COUNT(*) FROM invoices WHERE invoice_number LIKE $1`,
    [`INV-${year}-%`]
  );
  const count = parseInt(res.rows[0].count) + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
};

const runBillingCycle = async () => {
  const today = new Date().toISOString().split('T')[0];
  console.log(`🔄 Running billing cycle for date: ${today}`);

  // Get all active subscriptions due today or earlier
  const subsResult = await query(
    `SELECT s.*, c.name as customer_name 
     FROM subscriptions s 
     JOIN customers c ON s.customer_id = c.id
     WHERE s.status = 'active' 
     AND s.next_billing_date IS NOT NULL 
     AND s.next_billing_date <= $1`,
    [today]
  );

  const subscriptions = subsResult.rows;
  console.log(`📋 Found ${subscriptions.length} subscriptions due for billing`);

  const results = { success: 0, skipped: 0, failed: 0, invoices: [] };

  for (const sub of subscriptions) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const billingStart = sub.next_billing_date;
      const billingEnd = addBillingPeriod(billingStart, sub.billing_frequency);

      // Idempotency check - prevent duplicate invoices
      const existing = await client.query(
        `SELECT id FROM invoices WHERE subscription_id = $1 AND billing_period_start = $2`,
        [sub.id, billingStart]
      );

      if (existing.rows.length) {
        await client.query('ROLLBACK');
        console.log(`⏭️ Skipping ${sub.subscription_number} - invoice already exists for this period`);
        await query(
          `INSERT INTO billing_logs (subscription_id,status,message) VALUES ($1,'skipped',$2)`,
          [sub.id, `Invoice already exists for period ${billingStart}`]
        );
        results.skipped++;
        continue;
      }

      // Get subscription items
      const itemsResult = await client.query(
        `SELECT si.*, p.name as product_name, v.name as variant_name 
         FROM subscription_items si
         JOIN products p ON si.product_id = p.id
         LEFT JOIN product_variants v ON si.variant_id = v.id
         WHERE si.subscription_id = $1`,
        [sub.id]
      );
      const items = itemsResult.rows;
      const subtotal = items.reduce((acc, i) => acc + parseFloat(i.total_price), 0);

      // Calculate discount
      let discount_amount = 0;
      if (sub.discount_id) {
        const dr = await client.query('SELECT * FROM discount_rules WHERE id = $1 AND is_active = true', [sub.discount_id]);
        if (dr.rows.length) {
          const d = dr.rows[0];
          if (d.discount_type === 'percentage') {
            discount_amount = (subtotal * d.value) / 100;
          } else {
            discount_amount = Math.min(d.value, subtotal);
          }
        }
      }

      // Calculate tax
      let tax_amount = 0;
      if (sub.tax_id) {
        const tr = await client.query('SELECT * FROM tax_rules WHERE id = $1 AND is_active = true', [sub.tax_id]);
        if (tr.rows.length) {
          const t = tr.rows[0];
          const taxable = subtotal - discount_amount;
          if (t.tax_type === 'percentage') {
            tax_amount = (taxable * t.rate) / 100;
          } else {
            tax_amount = parseFloat(t.rate);
          }
        }
      }

      const total = Math.max(0, subtotal - discount_amount + tax_amount);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (sub.payment_terms || 30));

      const invoiceNum = await generateInvoiceNumber(client);
      const invoiceId = uuidv4();

      await client.query(
        `INSERT INTO invoices (id,invoice_number,customer_id,subscription_id,invoice_type,status,billing_period_start,billing_period_end,subtotal,discount_amount,tax_amount,total,amount_paid,outstanding_balance,discount_id,tax_id,due_date)
         VALUES ($1,$2,$3,$4,'recurring','confirmed',$5,$6,$7,$8,$9,$10,0,$10,$11,$12,$13)`,
        [invoiceId, invoiceNum, sub.customer_id, sub.id, billingStart, billingEnd,
         subtotal, discount_amount, tax_amount, total, sub.discount_id, sub.tax_id,
         dueDate.toISOString().split('T')[0]]
      );

      // Insert invoice items
      for (const item of items) {
        await client.query(
          `INSERT INTO invoice_items (id,invoice_id,product_id,variant_id,description,quantity,unit_price,total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [uuidv4(), invoiceId, item.product_id, item.variant_id,
           `${item.product_name}${item.variant_name ? ' - ' + item.variant_name : ''}`,
           item.quantity, item.unit_price, item.total_price]
        );
      }

      // Update next billing date
      const nextBilling = addBillingPeriod(billingEnd, sub.billing_frequency);
      // Check end date
      let newStatus = 'active';
      if (sub.end_date && nextBilling > sub.end_date) {
        newStatus = 'closed';
      }

      await client.query(
        `UPDATE subscriptions SET next_billing_date = $1, last_billing_date = $2, status = $3 WHERE id = $4`,
        [newStatus === 'closed' ? null : nextBilling, billingStart, newStatus, sub.id]
      );

      await client.query(
        `INSERT INTO billing_logs (subscription_id,invoice_id,status,message) VALUES ($1,$2,'success',$3)`,
        [sub.id, invoiceId, `Invoice ${invoiceNum} generated for period ${billingStart} to ${billingEnd}`]
      );

      await client.query('COMMIT');
      console.log(`✅ Generated invoice ${invoiceNum} for subscription ${sub.subscription_number}`);
      results.success++;
      results.invoices.push({ subscription: sub.subscription_number, invoice: invoiceNum, total });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed billing for subscription ${sub.subscription_number}:`, err.message);
      await query(
        `INSERT INTO billing_logs (subscription_id,status,message) VALUES ($1,'failed',$2)`,
        [sub.id, err.message]
      ).catch(() => {});
      results.failed++;
    } finally {
      client.release();
    }
  }

  // Update overdue invoices
  await query(
    `UPDATE invoices SET status = 'overdue' 
     WHERE status IN ('confirmed', 'partially_paid') 
     AND due_date < CURRENT_DATE`,
  );

  console.log(`🏁 Billing cycle complete: ${results.success} generated, ${results.skipped} skipped, ${results.failed} failed`);
  return results;
};

// Manual trigger endpoint
const triggerBilling = async (req, res, next) => {
  try {
    const results = await runBillingCycle();
    res.json({ message: 'Billing cycle completed', ...results });
  } catch (err) { next(err); }
};

const getBillingLogs = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT bl.*, s.subscription_number, i.invoice_number 
       FROM billing_logs bl 
       LEFT JOIN subscriptions s ON bl.subscription_id = s.id
       LEFT JOIN invoices i ON bl.invoice_id = i.id
       ORDER BY bl.created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = { runBillingCycle, triggerBilling, getBillingLogs };
