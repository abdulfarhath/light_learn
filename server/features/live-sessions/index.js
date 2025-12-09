/**
 * Live Sessions Feature Module
 *
 * This module handles all real-time live session functionality:
 * - Whiteboard drawing
 * - Video/Audio streaming
 * - Chat messaging
 * - Quizzes and polls
 * - Attendance tracking
 * - Audio transcription and summarization
 */

const liveSessionsSocket = require('./live-sessions.socket');
const liveSessionsRoutes = require('./live-sessions.routes');
const transcriptionService = require('./transcription.service');

module.exports = {
    socket: liveSessionsSocket,
    routes: liveSessionsRoutes,
    transcriptionService
};
