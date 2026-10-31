const cron = require('node-cron');
const { runBillingCycle } = require('../controllers/billingController');

const startBillingJob = () => {
  // Run billing at midnight every day
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ [CRON] Daily billing cycle triggered');
    try {
      const results = await runBillingCycle();
      console.log('✅ [CRON] Billing cycle complete:', results);
    } catch (err) {
      console.error('❌ [CRON] Billing cycle failed:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('⏰ Billing scheduler started (runs daily at midnight IST)');
};

module.exports = { startBillingJob };
