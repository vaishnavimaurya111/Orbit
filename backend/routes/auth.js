const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, me, updateProfile, listUsers, toggleUserStatus } = require('../controllers/authController');
const { authenticate, adminOnly, adminOrStaff } = require('../middleware/auth');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many requests, try again later' } });

router.post('/register', authLimiter, authenticate, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);
router.get('/users', authenticate, adminOnly, listUsers);
router.patch('/users/:id/toggle', authenticate, adminOnly, toggleUserStatus);

// Public register for first user (customer self-register)
router.post('/register/public', authLimiter, (req, res, next) => {
  req.user = { role: 'customer' }; // Force customer role
  next();
}, register);

module.exports = router;
