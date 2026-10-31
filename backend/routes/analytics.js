const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics, getRevenueChart, getSubscriptionChart, getSubscriptionStatusBreakdown,
  getMRRChart, getPaymentAnalytics, getRevenueReport, getSubscriptionReport,
  getCustomerGrowthReport, getOutstandingReport
} = require('../controllers/analyticsController');
const { authenticate, adminOrStaff } = require('../middleware/auth');

router.get('/dashboard', authenticate, adminOrStaff, getDashboardMetrics);
router.get('/revenue-chart', authenticate, adminOrStaff, getRevenueChart);
router.get('/subscription-chart', authenticate, adminOrStaff, getSubscriptionChart);
router.get('/subscription-status', authenticate, adminOrStaff, getSubscriptionStatusBreakdown);
router.get('/mrr-chart', authenticate, adminOrStaff, getMRRChart);
router.get('/payment-methods', authenticate, adminOrStaff, getPaymentAnalytics);
router.get('/reports/revenue', authenticate, adminOrStaff, getRevenueReport);
router.get('/reports/subscriptions', authenticate, adminOrStaff, getSubscriptionReport);
router.get('/reports/customer-growth', authenticate, adminOrStaff, getCustomerGrowthReport);
router.get('/reports/outstanding', authenticate, adminOrStaff, getOutstandingReport);

module.exports = router;
