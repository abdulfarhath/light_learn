// Make sure this path points to your database config
// It might be require('../../config/database') or require('../../shared/config/database')
const pool = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
    /**
     * Create a new user with profile details
     */
    async createUser(email, password, full_name, role, profileData = {}) {
        const { year, semester, branch, college } = profileData;
        const passwordHash = await bcrypt.hash(password, 10);

        // UPDATED: Insert and Return the new profile columns
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role, year, semester, branch, college)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, email, full_name, role, created_at, year, semester, branch, college`,
            [email, passwordHash, full_name, role, year, semester, branch, college]
        );

        return result.rows[0];
    }

    /**
     * Find user by email (Used for Login)
     */
    async findUserByEmail(email) {
        // UPDATED: Select all columns including year, semester, etc.
        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );
        return result.rows[0];
    }

    /**
     * Find user by ID (Used for 'Me' / Refreshing Session)
     */
    async findUserById(id) {
        // UPDATED: Explicitly select the profile columns
        const result = await pool.query(
            `SELECT id, email, full_name, role, password_hash, created_at, year, semester, branch, college 
             FROM users WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    generateToken(user) {
        return jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );
    }

    /**
     * Sanitize user data for response
     */
    sanitizeUser(user) {
        return {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            created_at: user.created_at,
            // UPDATED: Include new fields in the safe response
            year: user.year,
            semester: user.semester,
            branch: user.branch,
            college: user.college
        };
    }
}

module.exports = new AuthService();