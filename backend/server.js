require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { pool } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { startBillingJob } = require('./jobs/billingScheduler');

const app = express();

// =================== SECURITY MIDDLEWARE ===================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// General rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests from this IP' }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// =================== ROUTES ===================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api', require('./routes/taxDiscount'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// =================== ERROR HANDLING ===================
app.use(notFound);
app.use(errorHandler);

// =================== START SERVER ===================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection verified');

    app.listen(PORT, () => {
      console.log(`🚀 SubscriptIQ API running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });

    // Start billing scheduler
    startBillingJob();
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('⚠️  Make sure DATABASE_URL is set correctly in .env');
    process.exit(1);
  }
};

startServer();

module.exports = app;
