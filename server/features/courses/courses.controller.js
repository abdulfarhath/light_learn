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

            // TEACHER → return ALL subjects
            if (user.role === 'teacher') {
                const subjects = await coursesService.getAllSubjects();
                return res.json({ subjects });
            }

            // STUDENT with missing profile fields → fallback to ALL subjects
            if (!user.year || !user.semester || !user.branch || !user.college) {
                console.warn(
                    `User ${user.id} has incomplete profile. Returning all subjects as fallback.`
                );
                const subjects = await coursesService.getAllSubjects();
                return res.json({ subjects });

                /*
                // Original strict behavior (commented intentionally)
                return res.status(400).json({
                    error: 'Incomplete profile. Please update your profile with year, semester, branch, and college.'
                });
                */
            }

            // Apply filters for fully profiled students
            const filters = {
                year: Number(user.year),
                semester: Number(user.semester),
                branch: String(user.branch).trim().toLowerCase(),
                college: String(user.college).trim().toLowerCase()
            };

            console.log('FILTERS USED:', filters);

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
                subject_name,
                subject_code,
                year,
                semester,
                branch,
                college
            });

            res.status(201).json({ subject });

        } catch (error) {
            console.error('Create subject error:', error);
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Subject code already exists for this context' });
            }
            res.status(500).json({ error: 'Server error' });
        }
    }

    async getSubjectById(req, res) {
        try {
            const { id } = req.params;
            const subject = await coursesService.getSubjectById(id);

            if (!subject) {
                return res.status(404).json({ error: 'Subject not found' });
            }

            res.json({ subject });

        } catch (error) {
            console.error('Get subject error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async updateSubject(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const subject = await coursesService.updateSubject(id, updates);

            if (!subject) {
                return res.status(404).json({ error: 'Subject not found' });
            }

            res.json({ subject });

        } catch (error) {
            console.error('Update subject error:', error);
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Subject code already exists for this context' });
            }
            res.status(500).json({ error: 'Server error' });
        }
    }

    async deleteSubject(req, res) {
        try {
            const { id } = req.params;
            await coursesService.deleteSubject(id);
            res.json({ message: 'Subject deleted successfully' });

        } catch (error) {
            console.error('Delete subject error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new CoursesController();
