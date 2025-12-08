const coursesService = require('./courses.service');
const usersService = require('../users/users.service');

class CoursesController {
    async getSubjects(req, res) {
        try {
            const userId = req.user.id;
            const user = await usersService.findUserById(userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Required fields
            if (!user.year || !user.semester || !user.branch || !user.college) {
                return res.status(400).json({
                    error: 'Incomplete profile. Please update your profile with year, semester, branch, and college.'
                });
            }

            // ⭐ Normalize filters (fixes your empty subjects bug)
            const filters = {
                year: Number(user.year),
                semester: Number(user.semester),
                branch: String(user.branch).trim().toLowerCase(),
                college: String(user.college).trim().toLowerCase()
            };

            console.log("FILTERS USED:", filters);

            const subjects = await coursesService.getSubjectsByFilters(filters);

            return res.json({ subjects });

        } catch (error) {
            console.error('Get subjects error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new CoursesController();
