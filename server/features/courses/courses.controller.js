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

            // If profile fields are missing, return all subjects without filtering
            if (!user.year || !user.semester || !user.branch || !user.college) {
                console.log('User profile incomplete, returning all subjects');
                const subjects = await coursesService.getAllSubjects();
                return res.json({ subjects });
            }

            // Normalize filters (fixes your empty subjects bug)
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

    // ============================================
    // COURSE PROGRESS ENDPOINTS
    // ============================================

    /**
     * Get progress for a specific subject
     */
    async getProgress(req, res) {
        try {
            const studentId = req.user.id;
            const { subjectId } = req.params;

            const progress = await coursesService.getProgress(studentId, subjectId);
            const completedTopics = progress.map(p => p.topic_id);

            res.json({ progress, completedTopics });
        } catch (error) {
            console.error('Get progress error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * Get all course progress for dashboard
     */
    async getAllProgress(req, res) {
        try {
            const studentId = req.user.id;
            const progress = await coursesService.getAllProgress(studentId);
            res.json({ progress });
        } catch (error) {
            console.error('Get all progress error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * Toggle topic completion
     */
    async toggleTopicCompletion(req, res) {
        try {
            const studentId = req.user.id;
            const { subjectId } = req.params;
            const { topicId } = req.body;

            if (!topicId) {
                return res.status(400).json({ error: 'Topic ID is required' });
            }

            const result = await coursesService.toggleTopicCompletion(studentId, subjectId, topicId);
            res.json(result);
        } catch (error) {
            console.error('Toggle completion error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new CoursesController();
