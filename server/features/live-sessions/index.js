/**
 * Live Sessions Feature Module
 * 
 * This module handles all real-time live session functionality:
 * - Whiteboard drawing
 * - Video/Audio streaming
 * - Chat messaging
 * - Quizzes and polls
 * - Attendance tracking
 */

const liveSessionsSocket = require('./live-sessions.socket');

module.exports = {
    socket: liveSessionsSocket
};
