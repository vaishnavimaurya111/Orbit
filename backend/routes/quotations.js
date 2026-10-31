const express = require('express');
const router = express.Router();
const { list, getById, create, updateStatus, convertToSubscription } = require('../controllers/quotationController');
const { authenticate, adminOrStaff } = require('../middleware/auth');

router.get('/', authenticate, adminOrStaff, list);
router.get('/:id', authenticate, adminOrStaff, getById);
router.post('/', authenticate, adminOrStaff, create);
router.patch('/:id/status', authenticate, adminOrStaff, updateStatus);
router.post('/:id/convert', authenticate, adminOrStaff, convertToSubscription);

module.exports = router;
