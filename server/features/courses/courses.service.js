const pool = require('../../shared/config/database');

class CoursesService {
    /**
     * Get all subjects (no filters)
     */
    async getAllSubjects() {
        const result = await pool.query(
            `SELECT *
             FROM subjects
             ORDER BY subject_name ASC`
        );
        return result.rows;
    }

    /**
     * Get subjects by filters (year, semester, branch, college)
     */
    async getSubjectsByFilters(filters) {
        const { year, semester, branch, college } = filters;

        console.log("Running DB Query With Filters:", filters);

        const result = await pool.query(
            `SELECT *
             FROM subjects
             WHERE year = $1
               AND semester = $2
               AND LOWER(branch) = LOWER($3)
               AND LOWER(college) = LOWER($4)
             ORDER BY subject_name ASC`,
            [year, semester, branch, college]
        );

        return result.rows;
    }

    async createSubject(subjectData) {
        const { subject_name, subject_code, year, semester, branch, college } = subjectData;
        const query = `
            INSERT INTO subjects (subject_name, subject_code, year, semester, branch, college)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(query, [subject_name, subject_code, year, semester, branch, college]);
        return result.rows[0];
    }

    /**
     * Get subject by ID
     */
    async getSubjectById(subject_id) {
        const result = await pool.query(
            'SELECT * FROM subjects WHERE id = $1',
            [subject_id]
        );
        return result.rows[0];
    }

    /**
     * Update subject
     */
    async updateSubject(subject_id, updates) {
        const { subject_name, subject_code, year, semester, branch, college } = updates;

        const result = await pool.query(
            `UPDATE subjects
             SET subject_name = COALESCE($1, subject_name),
                 subject_code = COALESCE($2, subject_code),
                 year = COALESCE($3, year),
                 semester = COALESCE($4, semester),
                 branch = COALESCE($5, branch),
                 college = COALESCE($6, college)
             WHERE id = $7
             RETURNING *`,
            [subject_name, subject_code, year, semester, branch, college, subject_id]
        );

        return result.rows[0];
    }

    /**
     * Delete subject
     */
    async deleteSubject(subject_id) {
        await pool.query('DELETE FROM subjects WHERE id = $1', [subject_id]);
    }

    // ============================================
    // COURSE PROGRESS METHODS
    // ============================================

    /**
     * Get progress for a student on a specific subject
     */
    async getProgress(student_id, subject_id) {
        const result = await pool.query(
            `SELECT topic_id, completed, completed_at
             FROM course_progress
             WHERE student_id = $1 AND subject_id = $2`,
            [student_id, subject_id]
        );
        return result.rows;
    }

    /**
     * Get all progress for a student (for dashboard)
     */
    async getAllProgress(student_id) {
        const result = await pool.query(
            `SELECT cp.subject_id, s.subject_name, s.subject_code,
                    COUNT(cp.topic_id) as completed_topics
             FROM course_progress cp
             JOIN subjects s ON s.id = cp.subject_id
             WHERE cp.student_id = $1 AND cp.completed = true
             GROUP BY cp.subject_id, s.subject_name, s.subject_code
             ORDER BY s.subject_name`,
            [student_id]
        );
        return result.rows;
    }

    /**
     * Toggle topic completion (add or remove)
     */
    async toggleTopicCompletion(student_id, subject_id, topic_id) {
        // Check if already completed
        const existing = await pool.query(
            `SELECT id FROM course_progress
             WHERE student_id = $1 AND subject_id = $2 AND topic_id = $3`,
            [student_id, subject_id, topic_id]
        );

        if (existing.rows.length > 0) {
            // Remove completion
            await pool.query(
                `DELETE FROM course_progress
                 WHERE student_id = $1 AND subject_id = $2 AND topic_id = $3`,
                [student_id, subject_id, topic_id]
            );
            return { completed: false, topic_id };
        } else {
            // Add completion
            const result = await pool.query(
                `INSERT INTO course_progress (student_id, subject_id, topic_id, completed)
                 VALUES ($1, $2, $3, true)
                 RETURNING *`,
                [student_id, subject_id, topic_id]
            );
            return { completed: true, topic_id, completed_at: result.rows[0].completed_at };
        }
    }

    /**
     * Mark multiple topics as complete
     */
    async markTopicsComplete(student_id, subject_id, topic_ids) {
        const values = topic_ids.map((topic_id, index) =>
            `($1, $2, $${index + 3}, true)`
        ).join(', ');

        const params = [student_id, subject_id, ...topic_ids];

        await pool.query(
            `INSERT INTO course_progress (student_id, subject_id, topic_id, completed)
             VALUES ${values}
             ON CONFLICT (student_id, subject_id, topic_id) DO NOTHING`,
            params
        );

        return { marked: topic_ids.length };
    }
}

module.exports = new CoursesService();
