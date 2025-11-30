const express = require('express');
const authController = require('./auth.controller');
const authValidation = require('./auth.validation');
const { authenticateToken } = require('./auth.middleware');

const router = express.Router();

/**
 * Auth Routes
 */

// POST /api/auth/register - Register new user
router.post('/register', authValidation.register, authController.register);

// POST /api/auth/login - Login user
router.post('/login', authValidation.login, authController.login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
