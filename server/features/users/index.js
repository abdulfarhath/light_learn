/**
 * Users Feature Module
 * 
 * This module handles all user management functionality:
 * - User profile retrieval
 * - List teachers
 * - List students
 * - User updates
 */

const usersRoutes = require('./users.routes');
const usersService = require('./users.service');

module.exports = {
    routes: usersRoutes,
    service: usersService
};
