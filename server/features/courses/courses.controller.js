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

    async createSubject(req, res) {
        try {
            const { subject_name, subject_code, year, semester, branch, college } = req.body;

            if (!subject_name || !subject_code || !year || !semester || !branch || !college) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            const subject = await coursesService.createSubject({
                subject_name, subject_code, year, semester, branch, college
            });

            res.status(201).json({ subject });
        } catch (error) {
            console.error('Create subject error:', error);
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({ error: 'Subject code already exists for this context' });
            }
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new CoursesController();
