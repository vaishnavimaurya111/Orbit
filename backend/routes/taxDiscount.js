const express = require('express');
const router = express.Router();
const {
  listTaxes, createTax, updateTax, toggleTax,
  listDiscounts, createDiscount, updateDiscount, toggleDiscount, validateDiscount
} = require('../controllers/taxDiscountController');
const { authenticate, adminOnly, adminOrStaff } = require('../middleware/auth');

// Tax routes
router.get('/taxes', authenticate, listTaxes);
router.post('/taxes', authenticate, adminOnly, createTax);
router.put('/taxes/:id', authenticate, adminOnly, updateTax);
router.patch('/taxes/:id/toggle', authenticate, adminOnly, toggleTax);

// Discount routes
router.get('/discounts', authenticate, listDiscounts);
router.post('/discounts', authenticate, adminOnly, createDiscount);
router.put('/discounts/:id', authenticate, adminOnly, updateDiscount);
router.patch('/discounts/:id/toggle', authenticate, adminOnly, toggleDiscount);
router.post('/discounts/validate', authenticate, adminOrStaff, validateDiscount);

module.exports = router;
