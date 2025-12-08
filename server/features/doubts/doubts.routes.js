const express = require('express');
const router = express.Router();
const doubtController = require('./doubts.controller');
const { authenticateToken } = require('../../middleware/auth'); // Adjust path to your auth middleware

// Apply auth middleware to all routes
router.use(authenticateToken);

router.get('/', doubtController.getDoubts);
router.post('/', doubtController.createDoubt);
router.post('/:id/answers', doubtController.addAnswer);
router.patch('/:id/status', doubtController.toggleStatus);

module.exports = router;