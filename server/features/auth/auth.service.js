const pool = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
    /**
     * Create a new student
     */
    async createStudent(email, password, full_name, profileData = {}) {
        const { year, semester, branch, college } = profileData;
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, year, semester, branch, college)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, email, full_name, created_at, year, semester, branch, college`,
            [email, passwordHash, full_name, year, semester, branch, college]
        );

        return { ...result.rows[0], role: 'student' };
    }

    /**
     * Create a new teacher
     */
    async createTeacher(email, password, full_name, department) {
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO teachers (email, password_hash, full_name, department)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, full_name, department, created_at`,
            [email, passwordHash, full_name, department]
        );

        return { ...result.rows[0], role: 'teacher' };
    }

    /**
     * Find user by email (checks both students and teachers)
     */
    async findUserByEmail(email) {
        // Try students table first
        const studentResult = await pool.query(
            `SELECT *, 'student' as role FROM users WHERE email = $1`,
            [email]
        );

        if (studentResult.rows.length > 0) {
            return studentResult.rows[0];
        }

        // Try teachers table
        const teacherResult = await pool.query(
            `SELECT *, 'teacher' as role FROM teachers WHERE email = $1`,
            [email]
        );

        return teacherResult.rows[0];
    }

    /**
     * Find user by ID and role
     */
    async findUserById(id, role) {
        if (role === 'student') {
            const result = await pool.query(
                `SELECT id, email, full_name, year, semester, branch, college, created_at 
                 FROM users WHERE id = $1`,
                [id]
            );
            return result.rows[0] ? { ...result.rows[0], role: 'student' } : null;
        } else {
            const result = await pool.query(
                `SELECT id, email, full_name, department, created_at 
                 FROM teachers WHERE id = $1`,
                [id]
            );
            return result.rows[0] ? { ...result.rows[0], role: 'teacher' } : null;
        }
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
     * Remove sensitive data
     */
    sanitizeUser(user) {
        const sanitized = {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            created_at: user.created_at,
        };

        // Add role-specific fields
        if (user.role === 'student') {
            sanitized.year = user.year;
            sanitized.semester = user.semester;
            sanitized.branch = user.branch;
            sanitized.college = user.college;
        } else if (user.role === 'teacher') {
            sanitized.department = user.department;
        }

        return sanitized;
    }
}

module.exports = new AuthService();