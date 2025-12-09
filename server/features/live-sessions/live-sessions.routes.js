const express = require('express');
const router = express.Router();
const controller = require('./live-sessions.controller');
const { authenticateToken } = require('../../middleware/auth');

// Process a recorded session (transcribe + summarize)
router.post('/process/:sessionId', authenticateToken, controller.processSession);

// Get processed session data (transcription + summary)
router.get('/session/:sessionId', authenticateToken, controller.getSession);

// Download transcription file
router.get('/download/:sessionId/transcription', authenticateToken, controller.downloadTranscription);

// Download summary file  
router.get('/download/:sessionId/summary', authenticateToken, controller.downloadSummary);

// List all recordings
router.get('/recordings', authenticateToken, controller.listRecordings);

module.exports = router;

