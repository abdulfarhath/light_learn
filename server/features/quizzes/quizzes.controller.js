const quizzesService = require('./quizzes.service');

class QuizzesController {
    /**
     * @route   POST /api/quizzes/create
     * @desc    Create a new quiz
     * @access  Private - Teacher
     */
    async createQuiz(req, res) {
        try {
            const { class_id, subject_id, title, questions, deadline } = req.body;
            const created_by = req.user.id;

            if (!class_id || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
                return res.status(400).json({ error: 'Class ID, title, and questions are required' });
            }

            const quiz = await quizzesService.createQuiz({
                class_id,
                subject_id,
                title,
                questions,
                deadline,
                created_by
            });

            res.status(201).json({ quiz });
        } catch (error) {
            console.error('Create quiz error:', error);
            res.status(500).json({ error: 'Server error while creating quiz' });
        }
    }

    /**
     * @route   GET /api/quizzes/my-quizzes
     * @desc    Get all quizzes created by teacher
     * @access  Private - Teacher
     */
    async getMyQuizzes(req, res) {
        try {
            const teacher_id = req.user.id;
            const quizzes = await quizzesService.getTeacherQuizzes(teacher_id);
            res.json({ quizzes });
        } catch (error) {
            console.error('Get teacher quizzes error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   GET /api/quizzes/class/:classId
     * @desc    Get all quizzes for a class
     * @access  Private
     */
    async getClassQuizzes(req, res) {
        try {
            const { classId } = req.params;
            const quizzes = await quizzesService.getClassQuizzes(classId);
            res.json({ quizzes });
        } catch (error) {
            console.error('Get class quizzes error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   GET /api/quizzes/:id
     * @desc    Get quiz by ID
     * @access  Private
     */
    async getQuizById(req, res) {
        try {
            const { id } = req.params;
            const quiz = await quizzesService.getQuizById(id);

            if (!quiz) {
                return res.status(404).json({ error: 'Quiz not found' });
            }

            res.json({ quiz });
        } catch (error) {
            console.error('Get quiz error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   PUT /api/quizzes/:id
     * @desc    Update quiz
     * @access  Private - Teacher
     */
    async updateQuiz(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const quiz = await quizzesService.updateQuiz(id, updates);

            if (!quiz) {
                return res.status(404).json({ error: 'Quiz not found' });
            }

            res.json({ quiz });
        } catch (error) {
            console.error('Update quiz error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   DELETE /api/quizzes/:id
     * @desc    Delete quiz
     * @access  Private - Teacher
     */
    async deleteQuiz(req, res) {
        try {
            const { id } = req.params;
            await quizzesService.deleteQuiz(id);
            res.json({ message: 'Quiz deleted successfully' });
        } catch (error) {
            console.error('Delete quiz error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   POST /api/quizzes/:id/submit
     * @desc    Submit quiz response
     * @access  Private - Student
     */
    async submitQuizResponse(req, res) {
        try {
            const { id } = req.params;
            const { answers } = req.body;
            const student_id = req.user.id;

            // Calculate score
            const quiz = await quizzesService.getQuizById(id);
            let score = 0;
            const questions = quiz.questions;

            questions.forEach((question, index) => {
                if (answers[index] === question.correctAnswer) {
                    score++;
                }
            });

            const response = await quizzesService.submitQuizResponse(id, student_id, answers, score);
            res.json({ response, score, total: questions.length });
        } catch (error) {
            console.error('Submit quiz error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new QuizzesController();

