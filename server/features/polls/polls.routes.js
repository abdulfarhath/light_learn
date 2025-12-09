const express = require('express');
const pollsController = require('./polls.controller');
const { authenticateToken, authorizeRoles } = require('../auth/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Teacher routes
router.post('/create', authorizeRoles('teacher'), pollsController.createPoll);
router.get('/my-polls', authorizeRoles('teacher'), pollsController.getMyPolls);
router.put('/:id', authorizeRoles('teacher'), pollsController.updatePoll);
router.delete('/:id', authorizeRoles('teacher'), pollsController.deletePoll);

// Shared routes
router.get('/class/:classId', pollsController.getClassPolls);
router.get('/:id', pollsController.getPollById);

// Student routes
router.post('/:id/submit', authorizeRoles('student'), pollsController.submitPollResponse);

module.exports = router;

