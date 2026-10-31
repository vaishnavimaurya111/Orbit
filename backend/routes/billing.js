const express = require('express');
const router = express.Router();
const { triggerBilling, getBillingLogs } = require('../controllers/billingController');
const { authenticate, adminOnly } = require('../middleware/auth');

router.post('/run', authenticate, adminOnly, triggerBilling);
router.get('/logs', authenticate, adminOnly, getBillingLogs);

module.exports = router;
