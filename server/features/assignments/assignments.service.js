const pool = require('../../shared/config/database');

class AssignmentsService {
    /**
     * Create a new assignment
     */
    async createAssignment(assignmentData) {
        const { class_id, subject_id, title, description, deadline, max_score, created_by } = assignmentData;
        
        const result = await pool.query(
            `INSERT INTO assignments (class_id, subject_id, title, description, deadline, max_score, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [class_id, subject_id, title, description, deadline, max_score || 100, created_by]
        );
        
        return result.rows[0];
    }

    /**
     * Get all assignments for a teacher
     */
    async getTeacherAssignments(teacher_id) {
        const result = await pool.query(
            `SELECT a.*, c.class_name, s.subject_name, s.subject_code,
                    COUNT(DISTINCT asub.student_id) as submission_count
             FROM assignments a
             LEFT JOIN classes c ON a.class_id = c.id
             LEFT JOIN subjects s ON a.subject_id = s.id
             LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
             WHERE a.created_by = $1
             GROUP BY a.id, c.class_name, s.subject_name, s.subject_code
             ORDER BY a.deadline DESC`,
            [teacher_id]
        );
        
        return result.rows;
    }

    /**
     * Get all assignments for a class
     */
    async getClassAssignments(class_id) {
        const result = await pool.query(
            `SELECT a.*, s.subject_name, s.subject_code,
                    COUNT(DISTINCT asub.student_id) as submission_count
             FROM assignments a
             LEFT JOIN subjects s ON a.subject_id = s.id
             LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
             WHERE a.class_id = $1
             GROUP BY a.id, s.subject_name, s.subject_code
             ORDER BY a.deadline DESC`,
            [class_id]
        );
        
        return result.rows;
    }

    /**
     * Get assignment by ID
     */
    async getAssignmentById(assignment_id) {
        const result = await pool.query(
            `SELECT a.*, c.class_name, s.subject_name, s.subject_code
             FROM assignments a
             LEFT JOIN classes c ON a.class_id = c.id
             LEFT JOIN subjects s ON a.subject_id = s.id
             WHERE a.id = $1`,
            [assignment_id]
        );
        
        return result.rows[0];
    }

    /**
     * Update assignment
     */
    async updateAssignment(assignment_id, updates) {
        const { title, description, deadline, max_score } = updates;
        
        const result = await pool.query(
            `UPDATE assignments
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 deadline = COALESCE($3, deadline),
                 max_score = COALESCE($4, max_score)
             WHERE id = $5
             RETURNING *`,
            [title, description, deadline, max_score, assignment_id]
        );
        
        return result.rows[0];
    }

    /**
     * Delete assignment
     */
    async deleteAssignment(assignment_id) {
        await pool.query('DELETE FROM assignments WHERE id = $1', [assignment_id]);
    }

    /**
     * Submit assignment
     */
    async submitAssignment(assignment_id, student_id, submission_text, file_url) {
        const result = await pool.query(
            `INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, file_url)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (assignment_id, student_id)
             DO UPDATE SET submission_text = $3, file_url = $4, submitted_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [assignment_id, student_id, submission_text, file_url]
        );
        
        return result.rows[0];
    }

    /**
     * Grade assignment submission
     */
    async gradeSubmission(submission_id, score, feedback) {
        const result = await pool.query(
            `UPDATE assignment_submissions
             SET score = $1, feedback = $2, graded_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [score, feedback, submission_id]
        );
        
        return result.rows[0];
    }

    /**
     * Get assignment submissions
     */
    async getAssignmentSubmissions(assignment_id) {
        const result = await pool.query(
            `SELECT asub.*, u.full_name, u.email
             FROM assignment_submissions asub
             JOIN users u ON asub.student_id = u.id
             WHERE asub.assignment_id = $1
             ORDER BY asub.submitted_at DESC`,
            [assignment_id]
        );
        
        return result.rows;
    }

    /**
     * Get student's assignment submission
     */
    async getStudentSubmission(assignment_id, student_id) {
        const result = await pool.query(
            `SELECT * FROM assignment_submissions
             WHERE assignment_id = $1 AND student_id = $2`,
            [assignment_id, student_id]
        );
        
        return result.rows[0];
    }
}

module.exports = new AssignmentsService();

