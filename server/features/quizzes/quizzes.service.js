const pool = require('../../shared/config/database');

class QuizzesService {
    /**
     * Create a new quiz
     */
    async createQuiz(quizData) {
        const { class_id, subject_id, title, questions, deadline, created_by } = quizData;
        
        const result = await pool.query(
            `INSERT INTO quizzes (class_id, subject_id, title, questions, deadline, created_by, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, true)
             RETURNING *`,
            [class_id, subject_id, title, JSON.stringify(questions), deadline, created_by]
        );
        
        return result.rows[0];
    }

    /**
     * Get all quizzes for a teacher
     */
    async getTeacherQuizzes(teacher_id) {
        const result = await pool.query(
            `SELECT q.*, c.class_name, s.subject_name, s.subject_code,
                    COUNT(DISTINCT qr.student_id) as response_count
             FROM quizzes q
             LEFT JOIN classes c ON q.class_id = c.id
             LEFT JOIN subjects s ON q.subject_id = s.id
             LEFT JOIN quiz_responses qr ON q.id = qr.quiz_id
             WHERE q.created_by = $1
             GROUP BY q.id, c.class_name, s.subject_name, s.subject_code
             ORDER BY q.created_at DESC`,
            [teacher_id]
        );
        
        return result.rows;
    }

    /**
     * Get all quizzes for a class
     */
    async getClassQuizzes(class_id) {
        const result = await pool.query(
            `SELECT q.*, s.subject_name, s.subject_code,
                    COUNT(DISTINCT qr.student_id) as response_count
             FROM quizzes q
             LEFT JOIN subjects s ON q.subject_id = s.id
             LEFT JOIN quiz_responses qr ON q.id = qr.quiz_id
             WHERE q.class_id = $1 AND q.is_active = true
             GROUP BY q.id, s.subject_name, s.subject_code
             ORDER BY q.created_at DESC`,
            [class_id]
        );
        
        return result.rows;
    }

    /**
     * Get quiz by ID
     */
    async getQuizById(quiz_id) {
        const result = await pool.query(
            `SELECT q.*, c.class_name, s.subject_name, s.subject_code
             FROM quizzes q
             LEFT JOIN classes c ON q.class_id = c.id
             LEFT JOIN subjects s ON q.subject_id = s.id
             WHERE q.id = $1`,
            [quiz_id]
        );
        
        return result.rows[0];
    }

    /**
     * Update quiz
     */
    async updateQuiz(quiz_id, updates) {
        const { title, questions, deadline, is_active } = updates;
        
        const result = await pool.query(
            `UPDATE quizzes
             SET title = COALESCE($1, title),
                 questions = COALESCE($2, questions),
                 deadline = COALESCE($3, deadline),
                 is_active = COALESCE($4, is_active)
             WHERE id = $5
             RETURNING *`,
            [title, questions ? JSON.stringify(questions) : null, deadline, is_active, quiz_id]
        );
        
        return result.rows[0];
    }

    /**
     * Delete quiz
     */
    async deleteQuiz(quiz_id) {
        await pool.query('DELETE FROM quizzes WHERE id = $1', [quiz_id]);
    }

    /**
     * Submit quiz response
     */
    async submitQuizResponse(quiz_id, student_id, answers, score) {
        const result = await pool.query(
            `INSERT INTO quiz_responses (quiz_id, student_id, answers, score)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (quiz_id, student_id)
             DO UPDATE SET answers = $3, score = $4, submitted_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [quiz_id, student_id, JSON.stringify(answers), score]
        );
        
        return result.rows[0];
    }

    /**
     * Get quiz responses
     */
    async getQuizResponses(quiz_id) {
        const result = await pool.query(
            `SELECT qr.*, u.full_name, u.email
             FROM quiz_responses qr
             JOIN users u ON qr.student_id = u.id
             WHERE qr.quiz_id = $1
             ORDER BY qr.submitted_at DESC`,
            [quiz_id]
        );
        
        return result.rows;
    }

    /**
     * Get student's quiz response
     */
    async getStudentQuizResponse(quiz_id, student_id) {
        const result = await pool.query(
            `SELECT * FROM quiz_responses
             WHERE quiz_id = $1 AND student_id = $2`,
            [quiz_id, student_id]
        );
        
        return result.rows[0];
    }
}

module.exports = new QuizzesService();

