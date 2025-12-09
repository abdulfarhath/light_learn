const express = require('express');
const router = express.Router();
const coursesController = require('./courses.controller');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

router.get('/subjects', coursesController.getSubjects);
router.get('/subjects/:id', coursesController.getSubjectById);
router.post('/create', authorizeRoles('teacher'), coursesController.createSubject);
router.put('/subjects/:id', authorizeRoles('teacher'), coursesController.updateSubject);
router.delete('/subjects/:id', authorizeRoles('teacher'), coursesController.deleteSubject);

module.exports = router;
