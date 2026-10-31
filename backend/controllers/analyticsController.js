const { query } = require('../config/database');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];

    // Core metrics
    const [
      revenueRes, mrrRes, activeSubsRes, totalCustRes, newCustRes,
      outstandingRes, overdueRes, cancelledRes, upcomingRes
    ] = await Promise.all([
      // Total Revenue (paid invoices in period)
      query(`SELECT COALESCE(SUM(amount_paid),0) as total FROM invoices WHERE status IN ('paid','partially_paid') AND created_at >= $1`, [startStr]),
      // MRR - sum of active monthly subscriptions
      query(`SELECT COALESCE(SUM(recurring_amount),0) as mrr FROM subscriptions WHERE status = 'active' AND billing_frequency = 'monthly'`),
      // Active subscriptions
      query(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`),
      // Total customers
      query(`SELECT COUNT(*) as count FROM customers WHERE is_active = true`),
      // New customers in period
      query(`SELECT COUNT(*) as count FROM customers WHERE created_at >= $1`, [startStr]),
      // Outstanding invoices
      query(`SELECT COUNT(*) as count, COALESCE(SUM(outstanding_balance),0) as amount FROM invoices WHERE status IN ('confirmed','partially_paid')`),
      // Overdue invoices
      query(`SELECT COUNT(*) as count, COALESCE(SUM(outstanding_balance),0) as amount FROM invoices WHERE status = 'overdue'`),
      // Cancelled/closed subscriptions in period
      query(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'closed' AND closed_at >= $1`, [startStr]),
      // Upcoming renewals (next 7 days)
      query(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active' AND next_billing_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`),
    ]);

    const mrr = parseFloat(mrrRes.rows[0].mrr);
    const arr = mrr * 12;

    res.json({
      revenue: parseFloat(revenueRes.rows[0].total),
      mrr,
      arr,
      active_subscriptions: parseInt(activeSubsRes.rows[0].count),
      total_customers: parseInt(totalCustRes.rows[0].count),
      new_customers: parseInt(newCustRes.rows[0].count),
      outstanding_invoices: {
        count: parseInt(outstandingRes.rows[0].count),
        amount: parseFloat(outstandingRes.rows[0].amount),
      },
      overdue_invoices: {
        count: parseInt(overdueRes.rows[0].count),
        amount: parseFloat(overdueRes.rows[0].amount),
      },
      cancelled_subscriptions: parseInt(cancelledRes.rows[0].count),
      upcoming_renewals: parseInt(upcomingRes.rows[0].count),
    });
  } catch (err) { next(err); }
};

const getRevenueChart = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const result = await query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        DATE_TRUNC('month', created_at) as month_date,
        COALESCE(SUM(amount_paid), 0) as revenue,
        COUNT(*) as invoice_count
       FROM invoices 
       WHERE status IN ('paid', 'partially_paid')
       AND created_at >= NOW() - ($1 || ' months')::interval
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month_date ASC`,
      [months]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getSubscriptionChart = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const result = await query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        DATE_TRUNC('month', created_at) as month_date,
        COUNT(*) as new_subscriptions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
       FROM subscriptions
       WHERE created_at >= NOW() - ($1 || ' months')::interval
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month_date ASC`,
      [months]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getSubscriptionStatusBreakdown = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT status, COUNT(*) as count FROM subscriptions GROUP BY status ORDER BY count DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getMRRChart = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const result = await query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        DATE_TRUNC('month', created_at) as month_date,
        COALESCE(SUM(CASE WHEN billing_frequency = 'monthly' THEN recurring_amount
                          WHEN billing_frequency = 'yearly' THEN recurring_amount / 12
                          WHEN billing_frequency = 'weekly' THEN recurring_amount * 4.33
                          WHEN billing_frequency = 'daily' THEN recurring_amount * 30
                          ELSE 0 END), 0) as mrr
       FROM subscriptions
       WHERE status = 'active'
       AND created_at >= NOW() - ($1 || ' months')::interval
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month_date ASC`,
      [months]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getPaymentAnalytics = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
       FROM payments
       WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY payment_method
       ORDER BY total_amount DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// Reports
const getRevenueReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const result = await query(
      `SELECT i.invoice_number, c.name as customer_name, c.company_name, i.total, i.amount_paid, i.outstanding_balance, i.status, i.created_at, i.due_date
       FROM invoices i JOIN customers c ON i.customer_id = c.id
       WHERE i.created_at BETWEEN $1 AND $2
       ORDER BY i.created_at DESC`,
      [from || '2020-01-01', to || new Date().toISOString().split('T')[0]]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getSubscriptionReport = async (req, res, next) => {
  try {
    const { from, to, status } = req.query;
    let sql = `SELECT s.subscription_number, c.name as customer_name, c.company_name, p.name as plan_name, s.status, s.billing_frequency, s.recurring_amount, s.start_date, s.end_date, s.next_billing_date, s.created_at
               FROM subscriptions s JOIN customers c ON s.customer_id = c.id LEFT JOIN plans p ON s.plan_id = p.id WHERE s.created_at BETWEEN $1 AND $2`;
    const params = [from || '2020-01-01', to || new Date().toISOString().split('T')[0]];
    if (status) { sql += ` AND s.status = $3`; params.push(status); }
    sql += ' ORDER BY s.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getCustomerGrowthReport = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month, DATE_TRUNC('month', created_at) as month_date, COUNT(*) as new_customers
       FROM customers WHERE created_at >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', created_at) ORDER BY month_date ASC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const getOutstandingReport = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT i.invoice_number, c.name as customer_name, c.company_name, i.total, i.amount_paid, i.outstanding_balance, i.due_date, i.status,
       CASE WHEN i.due_date < CURRENT_DATE THEN (CURRENT_DATE - i.due_date) ELSE 0 END as days_overdue
       FROM invoices i JOIN customers c ON i.customer_id = c.id
       WHERE i.status IN ('confirmed', 'partially_paid', 'overdue')
       ORDER BY i.due_date ASC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = {
  getDashboardMetrics, getRevenueChart, getSubscriptionChart, getSubscriptionStatusBreakdown,
  getMRRChart, getPaymentAnalytics, getRevenueReport, getSubscriptionReport,
  getCustomerGrowthReport, getOutstandingReport
};
