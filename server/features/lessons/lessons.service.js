const pool = require('../../config/database');

class LessonsService {
    async createLesson(lessonData) {
        const { title, description, teacher_id, class_id, audio_url, events_url, pdf_url, duration } = lessonData;
        
        const query = `
            INSERT INTO recordings (title, description, teacher_id, class_id, audio_url, events_url, pdf_url, duration)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const values = [title, description, teacher_id, class_id, audio_url, events_url, pdf_url, duration];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async getLessonById(id) {
        const query = `SELECT * FROM recordings WHERE id = $1`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    async getLessonsByTeacher(teacherId) {
        const query = `SELECT * FROM recordings WHERE teacher_id = $1 ORDER BY created_at DESC`;
        const result = await pool.query(query, [teacherId]);
        return result.rows;
    }

    async getAllLessons() {
        const query = `SELECT * FROM recordings ORDER BY created_at DESC`;
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = new LessonsService();
