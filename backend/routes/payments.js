const express = require('express');
const router = express.Router();
const { list, record } = require('../controllers/paymentController');
const { authenticate, adminOrStaff } = require('../middleware/auth');

router.get('/', authenticate, list);
router.post('/', authenticate, adminOrStaff, record);

module.exports = router;
