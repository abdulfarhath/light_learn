const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const teacherCoursesController = require('./teacher-courses.controller');
const { authenticateToken } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Validation rules
const courseValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('status').optional().isIn(['draft', 'published']).withMessage('Invalid status')
];

const topicValidation = [
    body('title').trim().notEmpty().withMessage('Title is required')
];

const materialValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('material_type').isIn(['ppt', 'pdf', 'video', 'document']).withMessage('Invalid material type')
];

// Course management
router.post('/', courseValidation, teacherCoursesController.createCourse.bind(teacherCoursesController));
router.get('/', teacherCoursesController.getMyCourses.bind(teacherCoursesController));
router.get('/:id', teacherCoursesController.getCourseById.bind(teacherCoursesController));
router.put('/:id', courseValidation, teacherCoursesController.updateCourse.bind(teacherCoursesController));
router.delete('/:id', teacherCoursesController.deleteCourse.bind(teacherCoursesController));

// Topic management
router.post('/:id/topics', topicValidation, teacherCoursesController.addTopic.bind(teacherCoursesController));
router.delete('/topics/:id', teacherCoursesController.deleteTopic.bind(teacherCoursesController));

// Material management
router.post('/topics/:topicId/materials', materialValidation, teacherCoursesController.addMaterial.bind(teacherCoursesController));
router.delete('/materials/:id', teacherCoursesController.deleteMaterial.bind(teacherCoursesController));

// File upload
router.post('/upload', teacherCoursesController.uploadFile.bind(teacherCoursesController));

module.exports = router;
