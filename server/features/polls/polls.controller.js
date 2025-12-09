const pollsService = require('./polls.service');

class PollsController {
    /**
     * @route   POST /api/polls/create
     * @desc    Create a new poll
     * @access  Private - Teacher
     */
    async createPoll(req, res) {
        try {
            const { class_id, subject_id, title, question, options, deadline } = req.body;
            const created_by = req.user.id;

            if (!class_id || !title || !question || !options || !Array.isArray(options) || options.length < 2) {
                return res.status(400).json({ error: 'Class ID, title, question, and at least 2 options are required' });
            }

            const poll = await pollsService.createPoll({
                class_id,
                subject_id,
                title,
                question,
                options,
                deadline,
                created_by
            });

            res.status(201).json({ poll });
        } catch (error) {
            console.error('Create poll error:', error);
            res.status(500).json({ error: 'Server error while creating poll' });
        }
    }

    /**
     * @route   GET /api/polls/my-polls
     * @desc    Get all polls created by teacher
     * @access  Private - Teacher
     */
    async getMyPolls(req, res) {
        try {
            const teacher_id = req.user.id;
            const polls = await pollsService.getTeacherPolls(teacher_id);
            res.json({ polls });
        } catch (error) {
            console.error('Get teacher polls error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   GET /api/polls/class/:classId
     * @desc    Get all polls for a class
     * @access  Private
     */
    async getClassPolls(req, res) {
        try {
            const { classId } = req.params;
            const polls = await pollsService.getClassPolls(classId);
            res.json({ polls });
        } catch (error) {
            console.error('Get class polls error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   GET /api/polls/:id
     * @desc    Get poll by ID with results
     * @access  Private
     */
    async getPollById(req, res) {
        try {
            const { id } = req.params;
            const poll = await pollsService.getPollById(id);

            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }

            res.json({ poll });
        } catch (error) {
            console.error('Get poll error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   PUT /api/polls/:id
     * @desc    Update poll
     * @access  Private - Teacher
     */
    async updatePoll(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const poll = await pollsService.updatePoll(id, updates);

            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }

            res.json({ poll });
        } catch (error) {
            console.error('Update poll error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   DELETE /api/polls/:id
     * @desc    Delete poll
     * @access  Private - Teacher
     */
    async deletePoll(req, res) {
        try {
            const { id } = req.params;
            await pollsService.deletePoll(id);
            res.json({ message: 'Poll deleted successfully' });
        } catch (error) {
            console.error('Delete poll error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   POST /api/polls/:id/submit
     * @desc    Submit poll response
     * @access  Private - Student
     */
    async submitPollResponse(req, res) {
        try {
            const { id } = req.params;
            const { selected_option } = req.body;
            const student_id = req.user.id;

            if (selected_option === undefined || selected_option === null) {
                return res.status(400).json({ error: 'Selected option is required' });
            }

            const response = await pollsService.submitPollResponse(id, student_id, selected_option);
            res.json({ response, message: 'Poll response submitted successfully' });
        } catch (error) {
            console.error('Submit poll error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new PollsController();

