const express = require('express');
const router = express.Router();
const { list, getById, create, update, archive, listVariants, createVariant, updateVariant } = require('../controllers/productController');
const { authenticate, adminOrStaff } = require('../middleware/auth');

router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, adminOrStaff, create);
router.put('/:id', authenticate, adminOrStaff, update);
router.patch('/:id/archive', authenticate, adminOrStaff, archive);
router.get('/:productId/variants', authenticate, listVariants);
router.post('/:productId/variants', authenticate, adminOrStaff, createVariant);
router.put('/variants/:id', authenticate, adminOrStaff, updateVariant);

module.exports = router;
