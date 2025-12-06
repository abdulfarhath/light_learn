const express = require('express');
const router = express.Router();
const coursesController = require('./courses.controller');
const { authenticateToken } = require('../../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

router.get('/subjects', coursesController.getSubjects);

module.exports = router;
