const coursesService = require('./courses.service');
const usersService = require('../users/users.service');

class CoursesController {
    async getSubjects(req, res) {
        try {
            // Get user details to filter subjects
            // Assuming req.user.id is available from auth middleware
            const userId = req.user.id;
            const user = await usersService.getUserById(userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // If user has profile details, use them to filter
            // Otherwise, return empty list or all subjects (depending on requirements)
            // For now, we'll require the profile details
            if (!user.year || !user.semester || !user.branch || !user.college) {
                return res.status(400).json({
                    error: 'Incomplete profile. Please update your profile with year, semester, branch, and college.'
                });
            }

            const subjects = await coursesService.getSubjectsByFilters({
                year: user.year,
                semester: user.semester,
                branch: user.branch,
                college: user.college
            });

            res.json({ subjects });
        } catch (error) {
            console.error('Get subjects error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new CoursesController();
