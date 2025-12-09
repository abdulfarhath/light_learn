const transcriptionService = require('./transcription.service');
const path = require('path');
const fs = require('fs');

/**
 * Process a recorded session - transcribe and summarize
 * POST /api/live-sessions/process/:sessionId
 */
const processSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Session ID is required' 
            });
        }

        console.log(`Processing session request: ${sessionId}`);
        
        const result = await transcriptionService.processSession(sessionId);
        
        res.json({
            success: true,
            message: 'Session processed successfully',
            data: {
                sessionId: result.sessionId,
                transcription: result.transcription,
                summary: result.summary,
                mock: result.mock
            }
        });

    } catch (error) {
        console.error('Process session error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process session'
        });
    }
};

/**
 * Get processed session data
 * GET /api/live-sessions/session/:sessionId
 */
const getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const data = await transcriptionService.getSessionData(sessionId);
        
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Session data not found. Session may not have been processed yet.'
            });
        }

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Get session error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve session data'
        });
    }
};

/**
 * Download transcription as .txt file
 * GET /api/live-sessions/download/:sessionId/transcription
 */
const downloadTranscription = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const outputDir = path.join(transcriptionService.storageDir, 'processed');
        const filePath = path.join(outputDir, `${sessionId}_transcription.txt`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Transcription file not found'
            });
        }

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${sessionId}_transcription.txt"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to download transcription'
        });
    }
};

/**
 * Download summary as .txt file
 * GET /api/live-sessions/download/:sessionId/summary
 */
const downloadSummary = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const outputDir = path.join(transcriptionService.storageDir, 'processed');
        const filePath = path.join(outputDir, `${sessionId}_summary.txt`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Summary file not found'
            });
        }

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${sessionId}_summary.txt"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to download summary'
        });
    }
};

/**
 * List all recorded sessions
 * GET /api/live-sessions/recordings
 */
const listRecordings = async (req, res) => {
    try {
        const storageDir = transcriptionService.storageDir;
        
        if (!fs.existsSync(storageDir)) {
            return res.json({ success: true, recordings: [] });
        }

        const files = fs.readdirSync(storageDir);
        const recordings = files
            .filter(f => f.endsWith('.webm'))
            .map(f => {
                const sessionId = f.replace('.webm', '');
                const stats = fs.statSync(path.join(storageDir, f));
                return {
                    sessionId,
                    size: stats.size,
                    createdAt: stats.birthtime
                };
            });

        res.json({ success: true, recordings });

    } catch (error) {
        console.error('List recordings error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to list recordings'
        });
    }
};

module.exports = {
    processSession,
    getSession,
    downloadTranscription,
    downloadSummary,
    listRecordings
};

