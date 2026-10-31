const express = require('express');
const router = express.Router();
const { list, getById, create, update, toggleStatus } = require('../controllers/planController');
const { authenticate, adminOrStaff, adminOnly } = require('../middleware/auth');

router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, adminOnly, create);
router.put('/:id', authenticate, adminOnly, update);
router.patch('/:id/toggle', authenticate, adminOnly, toggleStatus);

module.exports = router;
