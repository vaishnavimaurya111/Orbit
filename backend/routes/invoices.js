const express = require('express');
const router = express.Router();
const { list, getById, createManual, updateStatus } = require('../controllers/invoiceController');
const { authenticate, adminOrStaff } = require('../middleware/auth');

router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, adminOrStaff, createManual);
router.patch('/:id/status', authenticate, adminOrStaff, updateStatus);

module.exports = router;
