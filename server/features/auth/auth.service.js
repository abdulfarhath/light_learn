const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../../shared/config/database');

/**
 * Auth Service - Handles business logic for authentication
 */
class AuthService {
    /**
     * Check if user exists by email
     */
    async findUserByEmail(email) {
        const result = await pool.query(
            'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    /**
     * Check if user exists by ID
     */
    async findUserById(id) {
        const result = await pool.query(
            'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    /**
     * Create a new user
     */
    async createUser(email, password, full_name, role, profileData = {}) {
        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const { year, semester, branch, college } = profileData;

        // Insert new user
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, role, year, semester, branch, college) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, full_name, role, year, semester, branch, college, created_at',
            [email, password_hash, full_name, role, year, semester, branch, college]
        );

        return result.rows[0];
    }

    /**
     * Verify password
     */
    async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Generate JWT token
     */
    generateToken(user) {
        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        return jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
    }

    /**
     * Sanitize user object (remove sensitive data)
     */
    sanitizeUser(user) {
        const { password_hash, ...sanitized } = user;
        return sanitized;
    }
}

module.exports = new AuthService();
