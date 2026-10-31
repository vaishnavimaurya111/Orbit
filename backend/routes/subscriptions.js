const express = require('express');
const router = express.Router();
const { list, getById, create, transition } = require('../controllers/subscriptionController');
const { authenticate, adminOrStaff } = require('../middleware/auth');

router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, adminOrStaff, create);
router.patch('/:id/transition', authenticate, adminOrStaff, transition);

module.exports = router;
