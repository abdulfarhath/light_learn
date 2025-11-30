/**
 * Auth Feature Module
 * 
 * This module handles all authentication-related functionality:
 * - User registration
 * - User login
 * - JWT token generation and verification
 * - Role-based authorization
 */

const authRoutes = require('./auth.routes');
const authMiddleware = require('./auth.middleware');
const authService = require('./auth.service');

module.exports = {
    routes: authRoutes,
    middleware: authMiddleware,
    service: authService
};
