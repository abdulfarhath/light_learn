const pool = require('../../shared/config/database');
const { generateClassCode } = require('../../shared/utils/generateClassCode');

/**
 * Classes Service - Handles business logic for class operations
 */
class ClassesService {
    /**
     * Create a new class
     */
    async createClass(className, teacherId) {
        // Generate unique class code
        let classCode;
        let isUnique = false;

        while (!isUnique) {
            classCode = generateClassCode();
            const existingClass = await pool.query(
                'SELECT id FROM classes WHERE class_code = $1',
                [classCode]
            );
            if (existingClass.rows.length === 0) {
                isUnique = true;
            }
        }

        // Create class
        const result = await pool.query(
            'INSERT INTO classes (class_code, class_name, teacher_id) VALUES ($1, $2, $3) RETURNING *',
            [classCode, className.trim(), teacherId]
        );

        return result.rows[0];
    }

    /**
     * Join a class with class code
     */
    async joinClass(classCode, studentId) {
        // Find class by code
        const classResult = await pool.query(
            'SELECT * FROM classes WHERE class_code = $1',
            [classCode.toUpperCase().trim()]
        );

        if (classResult.rows.length === 0) {
            return { error: 'Class not found with this code', status: 404 };
        }

        const classData = classResult.rows[0];

        // Check if already enrolled
        const enrollmentCheck = await pool.query(
            'SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
            [classData.id, studentId]
        );

        if (enrollmentCheck.rows.length > 0) {
            return { error: 'Already enrolled in this class', status: 409 };
        }

        // Enroll student
        await pool.query(
            'INSERT INTO class_enrollments (class_id, student_id) VALUES ($1, $2)',
            [classData.id, studentId]
        );

        return { class: classData };
    }

    /**
     * Get classes created by teacher
     */
    async getTeacherClasses(teacherId) {
        const result = await pool.query(
            `SELECT c.*, COUNT(ce.student_id) as student_count
       FROM classes c
       LEFT JOIN class_enrollments ce ON c.id = ce.class_id
       WHERE c.teacher_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
            [teacherId]
        );

        return result.rows;
    }

    /**
     * Get classes student is enrolled in
     */
    async getStudentClasses(studentId) {
        const result = await pool.query(
            `SELECT c.*, u.full_name as teacher_name, ce.enrolled_at,
       COUNT(ce2.student_id) as student_count
       FROM class_enrollments ce
       JOIN classes c ON ce.class_id = c.id
       JOIN users u ON c.teacher_id = u.id
       LEFT JOIN class_enrollments ce2 ON c.id = ce2.class_id
       WHERE ce.student_id = $1
       GROUP BY c.id, u.full_name, ce.enrolled_at
       ORDER BY ce.enrolled_at DESC`,
            [studentId]
        );

        return result.rows;
    }

    /**
     * Get all classes (for course catalog)
     */
    async getAllClasses() {
        const result = await pool.query(
            `SELECT c.*, u.full_name as teacher_name,
       COUNT(ce.student_id) as student_count
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       LEFT JOIN class_enrollments ce ON c.id = ce.class_id
       GROUP BY c.id, u.full_name
       ORDER BY c.created_at DESC`
        );

        return result.rows;
    }

    /**
     * Get class details by ID
     */
    async getClassById(classId) {
        const result = await pool.query(
            `SELECT c.*, u.full_name as teacher_name,
       COUNT(ce.student_id) as student_count
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       LEFT JOIN class_enrollments ce ON c.id = ce.class_id
       WHERE c.id = $1
       GROUP BY c.id, u.full_name`,
            [classId]
        );

        return result.rows[0];
    }

    /**
     * Get students enrolled in a class
     */
    async getClassStudents(classId, teacherId) {
        // Verify teacher owns this class
        const classCheck = await pool.query(
            'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
            [classId, teacherId]
        );

        if (classCheck.rows.length === 0) {
            return { error: 'Access denied to this class', status: 403 };
        }

        // Get enrolled students
        const result = await pool.query(
            `SELECT u.id, u.full_name, u.email, ce.enrolled_at
       FROM class_enrollments ce
       JOIN users u ON ce.student_id = u.id
       WHERE ce.class_id = $1
       ORDER BY ce.enrolled_at DESC`,
            [classId]
        );

        return { students: result.rows };
    }
}

module.exports = new ClassesService();
