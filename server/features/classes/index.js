/**
 * Classes Feature Module
 * 
 * This module handles all class management functionality:
 * - Create classes (teachers)
 * - Join classes with code (students)
 * - List teacher's classes
 * - List student's enrolled classes
 * - Get class details
 * - Get class students
 */

const classesRoutes = require('./classes.routes');
const classesService = require('./classes.service');

module.exports = {
    routes: classesRoutes,
    service: classesService
};
