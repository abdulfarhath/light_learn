const { body } = require('express-validator');

/**
 * Validation rules for authentication endpoints
 */
const authValidation = {
    register: [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('full_name').trim().notEmpty().withMessage('Full name is required'),
        body('role').isIn(['teacher', 'student']).withMessage('Role must be either teacher or student')
    ],

    login: [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ]
};

module.exports = authValidation;
