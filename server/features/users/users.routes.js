const express = require('express');
const usersController = require('./users.controller');
const { authenticateToken, authorizeRoles } = require('../auth/auth.middleware');

const router = express.Router();

/**
 * Users Routes
 */

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticateToken, usersController.getProfile);

// GET /api/users/teachers - Get all teachers (teacher only)
router.get('/teachers', authenticateToken, authorizeRoles('teacher'), usersController.getTeachers);

// GET /api/users/students - Get all students (teacher only)
router.get('/students', authenticateToken, authorizeRoles('teacher'), usersController.getStudents);

module.exports = router;
