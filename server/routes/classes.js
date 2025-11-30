const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { generateClassCode } = require('../utils/generateClassCode');

const router = express.Router();

/**
 * @route   POST /api/classes/create
 * @desc    Create a new class (Teacher only)
 * @access  Private - Teacher
 */
router.post('/create', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const { class_name } = req.body;
    const teacher_id = req.user.id;

    if (!class_name || class_name.trim().length === 0) {
        return res.status(400).json({ error: 'Class name is required' });
    }

    try {
        // Generate unique class code
        let class_code;
        let isUnique = false;

        while (!isUnique) {
            class_code = generateClassCode();
            const existingClass = await pool.query(
                'SELECT id FROM classes WHERE class_code = $1',
                [class_code]
            );
            if (existingClass.rows.length === 0) {
                isUnique = true;
            }
        }

        // Create class
        const result = await pool.query(
            'INSERT INTO classes (class_code, class_name, teacher_id) VALUES ($1, $2, $3) RETURNING *',
            [class_code, class_name.trim(), teacher_id]
        );

        const newClass = result.rows[0];

        res.status(201).json({
            message: 'Class created successfully',
            class: {
                id: newClass.id,
                class_code: newClass.class_code,
                class_name: newClass.class_name,
                created_at: newClass.created_at
            }
        });
    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({ error: 'Server error while creating class' });
    }
});

/**
 * @route   POST /api/classes/join
 * @desc    Join a class using class code (Student only)
 * @access  Private - Student
 */
router.post('/join', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const { class_code } = req.body;
    const student_id = req.user.id;

    if (!class_code || class_code.trim().length === 0) {
        return res.status(400).json({ error: 'Class code is required' });
    }

    try {
        // Find class by code
        const classResult = await pool.query(
            'SELECT * FROM classes WHERE class_code = $1',
            [class_code.toUpperCase().trim()]
        );

        if (classResult.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found with this code' });
        }

        const classData = classResult.rows[0];

        // Check if already enrolled
        const enrollmentCheck = await pool.query(
            'SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
            [classData.id, student_id]
        );

        if (enrollmentCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Already enrolled in this class' });
        }

        // Enroll student
        await pool.query(
            'INSERT INTO class_enrollments (class_id, student_id) VALUES ($1, $2)',
            [classData.id, student_id]
        );

        res.json({
            message: 'Enrolled successfully',
            class: {
                id: classData.id,
                class_code: classData.class_code,
                class_name: classData.class_name
            }
        });
    } catch (error) {
        console.error('Join class error:', error);
        res.status(500).json({ error: 'Server error while joining class' });
    }
});

/**
 * @route   GET /api/classes/my-classes
 * @desc    Get all classes created by the teacher
 * @access  Private - Teacher
 */
router.get('/my-classes', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const teacher_id = req.user.id;

    try {
        const result = await pool.query(
            `SELECT c.*, COUNT(ce.student_id) as student_count
       FROM classes c
       LEFT JOIN class_enrollments ce ON c.id = ce.class_id
       WHERE c.teacher_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
            [teacher_id]
        );

        res.json({ classes: result.rows });
    } catch (error) {
        console.error('Get teacher classes error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/classes/enrolled
 * @desc    Get all classes student is enrolled in
 * @access  Private - Student
 */
router.get('/enrolled', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const student_id = req.user.id;

    try {
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
            [student_id]
        );

        res.json({ classes: result.rows });
    } catch (error) {
        console.error('Get enrolled classes error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/classes/:id
 * @desc    Get class details
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
    const class_id = req.params.id;

    try {
        const result = await pool.query(
            `SELECT c.*, u.full_name as teacher_name,
       COUNT(ce.student_id) as student_count
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       LEFT JOIN class_enrollments ce ON c.id = ce.class_id
       WHERE c.id = $1
       GROUP BY c.id, u.full_name`,
            [class_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json({ class: result.rows[0] });
    } catch (error) {
        console.error('Get class details error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/classes/:id/students
 * @desc    Get all students enrolled in a class
 * @access  Private - Teacher (must own the class)
 */
router.get('/:id/students', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const class_id = req.params.id;
    const teacher_id = req.user.id;

    try {
        // Verify teacher owns this class
        const classCheck = await pool.query(
            'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
            [class_id, teacher_id]
        );

        if (classCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied to this class' });
        }

        // Get enrolled students
        const result = await pool.query(
            `SELECT u.id, u.full_name, u.email, ce.enrolled_at
       FROM class_enrollments ce
       JOIN users u ON ce.student_id = u.id
       WHERE ce.class_id = $1
       ORDER BY ce.enrolled_at DESC`,
            [class_id]
        );

        res.json({ students: result.rows });
    } catch (error) {
        console.error('Get class students error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
