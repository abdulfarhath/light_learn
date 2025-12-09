const pool = require('../../shared/config/database');

class PollsService {
    /**
     * Create a new poll
     */
    async createPoll(pollData) {
        const { class_id, subject_id, title, question, options, deadline, created_by } = pollData;
        
        const result = await pool.query(
            `INSERT INTO polls (class_id, subject_id, title, question, options, deadline, created_by, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true)
             RETURNING *`,
            [class_id, subject_id, title, question, JSON.stringify(options), deadline, created_by]
        );
        
        return result.rows[0];
    }

    /**
     * Get all polls for a teacher
     */
    async getTeacherPolls(teacher_id) {
        const result = await pool.query(
            `SELECT p.*, c.class_name, s.subject_name, s.subject_code,
                    COUNT(DISTINCT pr.student_id) as response_count
             FROM polls p
             LEFT JOIN classes c ON p.class_id = c.id
             LEFT JOIN subjects s ON p.subject_id = s.id
             LEFT JOIN poll_responses pr ON p.id = pr.poll_id
             WHERE p.created_by = $1
             GROUP BY p.id, c.class_name, s.subject_name, s.subject_code
             ORDER BY p.created_at DESC`,
            [teacher_id]
        );
        
        return result.rows;
    }

    /**
     * Get all polls for a class
     */
    async getClassPolls(class_id) {
        const result = await pool.query(
            `SELECT p.*, s.subject_name, s.subject_code,
                    COUNT(DISTINCT pr.student_id) as response_count
             FROM polls p
             LEFT JOIN subjects s ON p.subject_id = s.id
             LEFT JOIN poll_responses pr ON p.id = pr.poll_id
             WHERE p.class_id = $1 AND p.is_active = true
             GROUP BY p.id, s.subject_name, s.subject_code
             ORDER BY p.created_at DESC`,
            [class_id]
        );
        
        return result.rows;
    }

    /**
     * Get poll by ID with results
     */
    async getPollById(poll_id) {
        const pollResult = await pool.query(
            `SELECT p.*, c.class_name, s.subject_name, s.subject_code
             FROM polls p
             LEFT JOIN classes c ON p.class_id = c.id
             LEFT JOIN subjects s ON p.subject_id = s.id
             WHERE p.id = $1`,
            [poll_id]
        );
        
        if (pollResult.rows.length === 0) {
            return null;
        }
        
        const poll = pollResult.rows[0];
        
        // Get response statistics
        const statsResult = await pool.query(
            `SELECT selected_option, COUNT(*) as count
             FROM poll_responses
             WHERE poll_id = $1
             GROUP BY selected_option
             ORDER BY selected_option`,
            [poll_id]
        );
        
        poll.statistics = statsResult.rows;
        
        return poll;
    }

    /**
     * Update poll
     */
    async updatePoll(poll_id, updates) {
        const { title, question, options, deadline, is_active } = updates;
        
        const result = await pool.query(
            `UPDATE polls
             SET title = COALESCE($1, title),
                 question = COALESCE($2, question),
                 options = COALESCE($3, options),
                 deadline = COALESCE($4, deadline),
                 is_active = COALESCE($5, is_active)
             WHERE id = $6
             RETURNING *`,
            [title, question, options ? JSON.stringify(options) : null, deadline, is_active, poll_id]
        );
        
        return result.rows[0];
    }

    /**
     * Delete poll
     */
    async deletePoll(poll_id) {
        await pool.query('DELETE FROM polls WHERE id = $1', [poll_id]);
    }

    /**
     * Submit poll response
     */
    async submitPollResponse(poll_id, student_id, selected_option) {
        const result = await pool.query(
            `INSERT INTO poll_responses (poll_id, student_id, selected_option)
             VALUES ($1, $2, $3)
             ON CONFLICT (poll_id, student_id)
             DO UPDATE SET selected_option = $3, submitted_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [poll_id, student_id, selected_option]
        );
        
        return result.rows[0];
    }

    /**
     * Get student's poll response
     */
    async getStudentPollResponse(poll_id, student_id) {
        const result = await pool.query(
            `SELECT * FROM poll_responses
             WHERE poll_id = $1 AND student_id = $2`,
            [poll_id, student_id]
        );
        
        return result.rows[0];
    }
}

module.exports = new PollsService();

