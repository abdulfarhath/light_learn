const { validationResult } = require('express-validator');
const authService = require('./auth.service');

/**
 * Auth Controller - Handles HTTP requests for authentication
 */
class AuthController {
    /**
     * @route   POST /api/auth/register
     * @desc    Register a new user (teacher or student)
     * @access  Public
     */
    async register(req, res) {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, full_name, role } = req.body;

            // Check if user already exists
            const existingUser = await authService.findUserByEmail(email);
            if (existingUser) {
                return res.status(409).json({ error: 'User with this email already exists' });
            }

            // Create new user
            const newUser = await authService.createUser(email, password, full_name, role);

            res.status(201).json({
                message: 'User registered successfully',
                user: newUser
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Server error during registration' });
        }
    }

    /**
     * @route   POST /api/auth/login
     * @desc    Login user and return JWT token
     * @access  Public
     */
    async login(req, res) {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Find user by email
            const user = await authService.findUserByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Verify password
            const isValidPassword = await authService.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Generate JWT token
            const token = authService.generateToken(user);

            // Return sanitized user data
            const sanitizedUser = authService.sanitizeUser(user);

            res.json({
                message: 'Login successful',
                token,
                user: sanitizedUser
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error during login' });
        }
    }

    /**
     * @route   GET /api/auth/me
     * @desc    Get current user profile
     * @access  Private
     */
    async getMe(req, res) {
        try {
            const user = await authService.findUserById(req.user.id);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new AuthController();
