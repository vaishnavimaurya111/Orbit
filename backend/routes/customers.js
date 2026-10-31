const express = require('express');
const router = express.Router();
const { list, getById, create, update, toggleStatus } = require('../controllers/customerController');
const { authenticate, adminOrStaff, authorize } = require('../middleware/auth');

router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, adminOrStaff, create);
router.put('/:id', authenticate, update);
router.patch('/:id/toggle', authenticate, adminOrStaff, toggleStatus);

module.exports = router;
