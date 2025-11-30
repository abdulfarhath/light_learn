const express = require('express');
const classesController = require('./classes.controller');
const { authenticateToken, authorizeRoles } = require('../auth/auth.middleware');

const router = express.Router();

/**
 * Classes Routes
 */

// POST /api/classes/create - Create new class (Teacher only)
router.post('/create', authenticateToken, authorizeRoles('teacher'), classesController.createClass);

// POST /api/classes/join - Join class with code (Student only)
router.post('/join', authenticateToken, authorizeRoles('student'), classesController.joinClass);

// GET /api/classes/my-classes - Get teacher's classes
router.get('/my-classes', authenticateToken, authorizeRoles('teacher'), classesController.getMyClasses);

// GET /api/classes/enrolled - Get student's enrolled classes
router.get('/enrolled', authenticateToken, authorizeRoles('student'), classesController.getEnrolledClasses);

// GET /api/classes/:id - Get class details
router.get('/:id', authenticateToken, classesController.getClassDetails);

// GET /api/classes/:id/students - Get class students (Teacher only)
router.get('/:id/students', authenticateToken, authorizeRoles('teacher'), classesController.getClassStudents);

module.exports = router;
