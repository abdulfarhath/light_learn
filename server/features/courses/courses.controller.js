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
