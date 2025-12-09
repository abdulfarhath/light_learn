const express = require('express');
const quizzesController = require('./quizzes.controller');
const { authenticateToken, authorizeRoles } = require('../auth/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Teacher routes
router.post('/create', authorizeRoles('teacher'), quizzesController.createQuiz);
router.get('/my-quizzes', authorizeRoles('teacher'), quizzesController.getMyQuizzes);
router.put('/:id', authorizeRoles('teacher'), quizzesController.updateQuiz);
router.delete('/:id', authorizeRoles('teacher'), quizzesController.deleteQuiz);

// Shared routes
router.get('/class/:classId', quizzesController.getClassQuizzes);
router.get('/:id', quizzesController.getQuizById);

// Student routes
router.post('/:id/submit', authorizeRoles('student'), quizzesController.submitQuizResponse);

module.exports = router;

