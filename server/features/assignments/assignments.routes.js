const express = require('express');
const assignmentsController = require('./assignments.controller');
const { authenticateToken, authorizeRoles } = require('../auth/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Teacher routes
router.post('/create', authorizeRoles('teacher'), assignmentsController.createAssignment);
router.get('/my-assignments', authorizeRoles('teacher'), assignmentsController.getMyAssignments);
router.put('/:id', authorizeRoles('teacher'), assignmentsController.updateAssignment);
router.delete('/:id', authorizeRoles('teacher'), assignmentsController.deleteAssignment);
router.get('/:id/submissions', authorizeRoles('teacher'), assignmentsController.getAssignmentSubmissions);
router.put('/submissions/:id/grade', authorizeRoles('teacher'), assignmentsController.gradeSubmission);

// Shared routes
router.get('/class/:classId', assignmentsController.getClassAssignments);
router.get('/:id', assignmentsController.getAssignmentById);

// Student routes
router.post('/:id/submit', authorizeRoles('student'), assignmentsController.submitAssignment);

module.exports = router;

