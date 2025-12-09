const assignmentsService = require('./assignments.service');

class AssignmentsController {
    async createAssignment(req, res) {
        try {
            const { class_id, subject_id, title, description, deadline, max_score } = req.body;
            const created_by = req.user.id;

            if (!class_id || !title || !deadline) {
                return res.status(400).json({ error: 'Class ID, title, and deadline are required' });
            }

            const assignment = await assignmentsService.createAssignment({
                class_id, subject_id, title, description, deadline, max_score, created_by
            });

            res.status(201).json({ assignment });
        } catch (error) {
            console.error('Create assignment error:', error);
            res.status(500).json({ error: 'Server error while creating assignment' });
        }
    }

    async getMyAssignments(req, res) {
        try {
            const teacher_id = req.user.id;
            const assignments = await assignmentsService.getTeacherAssignments(teacher_id);
            res.json({ assignments });
        } catch (error) {
            console.error('Get teacher assignments error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async getClassAssignments(req, res) {
        try {
            const { classId } = req.params;
            const assignments = await assignmentsService.getClassAssignments(classId);
            res.json({ assignments });
        } catch (error) {
            console.error('Get class assignments error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async getAssignmentById(req, res) {
        try {
            const { id } = req.params;
            const assignment = await assignmentsService.getAssignmentById(id);

            if (!assignment) {
                return res.status(404).json({ error: 'Assignment not found' });
            }

            res.json({ assignment });
        } catch (error) {
            console.error('Get assignment error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async updateAssignment(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const assignment = await assignmentsService.updateAssignment(id, updates);

            if (!assignment) {
                return res.status(404).json({ error: 'Assignment not found' });
            }

            res.json({ assignment });
        } catch (error) {
            console.error('Update assignment error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async deleteAssignment(req, res) {
        try {
            const { id } = req.params;
            await assignmentsService.deleteAssignment(id);
            res.json({ message: 'Assignment deleted successfully' });
        } catch (error) {
            console.error('Delete assignment error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async submitAssignment(req, res) {
        try {
            const { id } = req.params;
            const { submission_text, file_url } = req.body;
            const student_id = req.user.id;

            const submission = await assignmentsService.submitAssignment(id, student_id, submission_text, file_url);
            res.json({ submission, message: 'Assignment submitted successfully' });
        } catch (error) {
            console.error('Submit assignment error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async gradeSubmission(req, res) {
        try {
            const { id } = req.params;
            const { score, feedback } = req.body;

            if (score === undefined || score === null) {
                return res.status(400).json({ error: 'Score is required' });
            }

            const submission = await assignmentsService.gradeSubmission(id, score, feedback);

            if (!submission) {
                return res.status(404).json({ error: 'Submission not found' });
            }

            res.json({ submission, message: 'Submission graded successfully' });
        } catch (error) {
            console.error('Grade submission error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async getAssignmentSubmissions(req, res) {
        try {
            const { id } = req.params;
            const submissions = await assignmentsService.getAssignmentSubmissions(id);
            res.json({ submissions });
        } catch (error) {
            console.error('Get submissions error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new AssignmentsController();

