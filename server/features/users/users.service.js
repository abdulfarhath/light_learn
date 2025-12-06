const pool = require('../../shared/config/database');

/**
 * Users Service - Handles business logic for user operations
 */
class UsersService {
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const result = await pool.query(
            'SELECT id, email, full_name, role, created_at, year, semester, branch, college FROM users WHERE id = $1',
            [userId]
        );
        return result.rows[0];
    }

    /**
     * Get all teachers
     */
    async getAllTeachers() {
        const result = await pool.query(
            'SELECT id, email, full_name, created_at FROM users WHERE role = $1',
            ['teacher']
        );
        return result.rows;
    }

    /**
     * Get all students
     */
    async getAllStudents() {
        const result = await pool.query(
            'SELECT id, email, full_name, created_at FROM users WHERE role = $1',
            ['student']
        );
        return result.rows;
    }

    /**
     * Update user profile
     */
    async updateUser(userId, updates) {
        const { full_name } = updates;
        const result = await pool.query(
            'UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, email, full_name, role, created_at',
            [full_name, userId]
        );
        return result.rows[0];
    }
}

module.exports = new UsersService();
