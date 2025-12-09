const pool = require('../../config/database');

const fs = require('fs');
const path = require('path');

class TeacherCoursesService {
    /**
     * Verify course ownership
     */
    async verifyCourseOwnership(courseId, teacherId) {
        const result = await pool.query(
            'SELECT id FROM courses WHERE id = $1 AND teacher_id = $2',
            [courseId, teacherId]
        );
        return result.rows.length > 0;
    }

    /**
     * Verify topic ownership
     */
    async verifyTopicOwnership(topicId, teacherId) {
        const result = await pool.query(
            `SELECT c.id 
             FROM courses c
             JOIN course_topics ct ON c.id = ct.course_id
             WHERE ct.id = $1 AND c.teacher_id = $2`,
            [topicId, teacherId]
        );
        return result.rows.length > 0;
    }

    /**
     * Verify material ownership
     */
    async verifyMaterialOwnership(materialId, teacherId) {
        const result = await pool.query(
            `SELECT c.id 
             FROM courses c
             JOIN course_topics ct ON c.id = ct.course_id
             JOIN course_materials cm ON ct.id = cm.topic_id
             WHERE cm.id = $1 AND c.teacher_id = $2`,
            [materialId, teacherId]
        );
        return result.rows.length > 0;
    }

    /**
     * Create a new course
     */
    async createCourse(teacherId, courseData) {
        const { title, description, status = 'draft' } = courseData;

        const result = await pool.query(
            `INSERT INTO courses (teacher_id, title, description, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [teacherId, title, description, status]
        );

        return result.rows[0];
    }

    /**
     * Get all courses by teacher
     */
    async getCoursesByTeacher(teacherId) {
        const result = await pool.query(
            `SELECT c.*, 
                    COUNT(DISTINCT ct.id) as topic_count,
                    COUNT(DISTINCT cm.id) as material_count
             FROM courses c
             LEFT JOIN course_topics ct ON c.id = ct.course_id
             LEFT JOIN course_materials cm ON ct.id = cm.topic_id
             WHERE c.teacher_id = $1
             GROUP BY c.id
             ORDER BY c.created_at DESC`,
            [teacherId]
        );

        return result.rows;
    }

    /**
     * Get course by ID with all topics and materials
     */
    async getCourseById(courseId) {
        // Get course
        const courseResult = await pool.query(
            'SELECT * FROM courses WHERE id = $1',
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return null;
        }

        const course = courseResult.rows[0];

        // Get topics
        const topicsResult = await pool.query(
            `SELECT * FROM course_topics 
             WHERE course_id = $1 
             ORDER BY order_index ASC`,
            [courseId]
        );

        // Get materials for each topic
        for (let topic of topicsResult.rows) {
            const materialsResult = await pool.query(
                `SELECT * FROM course_materials 
                 WHERE topic_id = $1 
                 ORDER BY order_index ASC`,
                [topic.id]
            );
            topic.materials = materialsResult.rows;
        }

        course.topics = topicsResult.rows;
        return course;
    }

    /**
     * Add a topic to a course
     */
    async addTopic(courseId, topicData) {
        const { title, description, order_index = 0 } = topicData;

        const result = await pool.query(
            `INSERT INTO course_topics (course_id, title, description, order_index)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [courseId, title, description, order_index]
        );

        return result.rows[0];
    }

    /**
     * Add material to a topic
     */
    async addMaterial(topicId, materialData) {
        const {
            material_type,
            title,
            description,
            file_name,
            file_path,
            file_size,
            order_index = 0
        } = materialData;

        const result = await pool.query(
            `INSERT INTO course_materials 
             (topic_id, material_type, title, description, file_name, file_path, file_size, order_index)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [topicId, material_type, title, description, file_name, file_path, file_size, order_index]
        );

        return result.rows[0];
    }

    /**
     * Update course
     */
    async updateCourse(courseId, courseData) {
        const { title, description, status } = courseData;

        const result = await pool.query(
            `UPDATE courses 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 status = COALESCE($3, status),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [title, description, status, courseId]
        );

        return result.rows[0];
    }

    /**
     * Delete course and associated files
     */
    async deleteCourse(courseId) {
        // 1. Get all materials to delete files
        const materialsResult = await pool.query(
            `SELECT cm.file_path 
             FROM course_materials cm
             JOIN course_topics ct ON cm.topic_id = ct.id
             WHERE ct.course_id = $1`,
            [courseId]
        );

        // 2. Delete files from filesystem
        for (const row of materialsResult.rows) {
            if (row.file_path) {
                const fullPath = path.join(__dirname, '../../', row.file_path);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
        }

        // 3. Delete course (cascade will handle topics and materials)
        await pool.query('DELETE FROM courses WHERE id = $1', [courseId]);
    }

    /**
     * Delete topic and associated files
     */
    async deleteTopic(topicId) {
        // 1. Get materials to delete files
        const materialsResult = await pool.query(
            'SELECT file_path FROM course_materials WHERE topic_id = $1',
            [topicId]
        );

        // 2. Delete files
        for (const row of materialsResult.rows) {
            if (row.file_path) {
                const fullPath = path.join(__dirname, '../../', row.file_path);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
        }

        // 3. Delete topic
        await pool.query('DELETE FROM course_topics WHERE id = $1', [topicId]);
    }

    /**
     * Delete material and associated file
     */
    async deleteMaterial(materialId) {
        // 1. Get file path
        const result = await pool.query(
            'SELECT file_path FROM course_materials WHERE id = $1',
            [materialId]
        );

        if (result.rows.length > 0) {
            const filePath = result.rows[0].file_path;
            if (filePath) {
                const fullPath = path.join(__dirname, '../../', filePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
        }

        // 2. Delete material
        await pool.query('DELETE FROM course_materials WHERE id = $1', [materialId]);
    }
}

module.exports = new TeacherCoursesService();
