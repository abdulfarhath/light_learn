const pool = require('../../shared/config/database');

class LiveSessionsService {
    // Create or get existing live session
    async getOrCreateSession(roomId, teacherId) {
        try {
            // Check if session exists
            let result = await pool.query(
                'SELECT * FROM live_sessions WHERE room_id = $1 AND is_active = true',
                [roomId]
            );

            if (result.rows.length > 0) {
                return result.rows[0];
            }

            // Create new session
            result = await pool.query(
                `INSERT INTO live_sessions (room_id, teacher_id, focus_timer_seconds, focus_timer_active, focus_timer_visible)
                 VALUES ($1, $2, 1500, false, true)
                 RETURNING *`,
                [roomId, teacherId]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error in getOrCreateSession:', error);
            throw error;
        }
    }

    // Update focus timer state
    async updateFocusTimer(roomId, timerSeconds, isActive) {
        try {
            const result = await pool.query(
                `UPDATE live_sessions 
                 SET focus_timer_seconds = $1, focus_timer_active = $2
                 WHERE room_id = $3 AND is_active = true
                 RETURNING *`,
                [timerSeconds, isActive, roomId]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error in updateFocusTimer:', error);
            throw error;
        }
    }

    // Update focus timer visibility
    async updateFocusVisibility(roomId, isVisible) {
        try {
            const result = await pool.query(
                `UPDATE live_sessions 
                 SET focus_timer_visible = $1
                 WHERE room_id = $2 AND is_active = true
                 RETURNING *`,
                [isVisible, roomId]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error in updateFocusVisibility:', error);
            throw error;
        }
    }

    // Get session state
    async getSessionState(roomId) {
        try {
            const result = await pool.query(
                'SELECT * FROM live_sessions WHERE room_id = $1 AND is_active = true',
                [roomId]
            );

            return result.rows[0] || null;
        } catch (error) {
            console.error('Error in getSessionState:', error);
            throw error;
        }
    }

    // End session
    async endSession(roomId) {
        try {
            const result = await pool.query(
                `UPDATE live_sessions 
                 SET is_active = false
                 WHERE room_id = $1
                 RETURNING *`,
                [roomId]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error in endSession:', error);
            throw error;
        }
    }

    // Get all active sessions for a teacher
    async getTeacherActiveSessions(teacherId) {
        try {
            const result = await pool.query(
                'SELECT * FROM live_sessions WHERE teacher_id = $1 AND is_active = true ORDER BY created_at DESC',
                [teacherId]
            );

            return result.rows;
        } catch (error) {
            console.error('Error in getTeacherActiveSessions:', error);
            throw error;
        }
    }
}

module.exports = new LiveSessionsService();

