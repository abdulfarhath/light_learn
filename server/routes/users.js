const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/users/teachers
 * @desc    Get all teachers (example teacher-only route)
 * @access  Private - Teacher only
 */
router.get('/teachers', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, created_at FROM users WHERE role = $1',
            ['teacher']
        );

        res.json({ teachers: result.rows });
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/users/students
 * @desc    Get all students (example route accessible by teachers)
 * @access  Private - Teacher only
 */
router.get('/students', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, created_at FROM users WHERE role = $1',
            ['student']
        );

        res.json({ students: result.rows });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
