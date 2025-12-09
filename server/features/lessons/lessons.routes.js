const express = require('express');
const router = express.Router();
const lessonsController = require('./lessons.controller');
const { authenticateToken } = require('../../middleware/auth');

router.post('/upload', authenticateToken, lessonsController.uploadMiddleware, lessonsController.uploadLesson);
router.get('/:id', authenticateToken, lessonsController.getLesson);
router.get('/teacher/all', authenticateToken, lessonsController.getTeacherLessons);
router.get('/student/all', authenticateToken, lessonsController.getStudentLessons);

module.exports = router;
