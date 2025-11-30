const usersService = require('./users.service');

/**
 * Users Controller - Handles HTTP requests for user operations
 */
class UsersController {
    /**
     * @route   GET /api/users/profile
     * @desc    Get user profile
     * @access  Private
     */
    async getProfile(req, res) {
        try {
            const user = await usersService.getUserById(req.user.id);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   GET /api/users/teachers
     * @desc    Get all teachers (example teacher-only route)
     * @access  Private - Teacher only
     */
    async getTeachers(req, res) {
        try {
            const teachers = await usersService.getAllTeachers();
            res.json({ teachers });
        } catch (error) {
            console.error('Get teachers error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   GET /api/users/students
     * @desc    Get all students (example route accessible by teachers)
     * @access  Private - Teacher only
     */
    async getStudents(req, res) {
        try {
            const students = await usersService.getAllStudents();
            res.json({ students });
        } catch (error) {
            console.error('Get students error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new UsersController();
