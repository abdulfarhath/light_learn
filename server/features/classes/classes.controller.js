const classesService = require('./classes.service');

/**
 * Classes Controller - Handles HTTP requests for class operations
 */
class ClassesController {
    /**
     * @route   POST /api/classes/create
     * @desc    Create a new class (Teacher only)
     * @access  Private - Teacher
     */
    async createClass(req, res) {
        const { class_name } = req.body;
        const teacher_id = req.user.id;

        if (!class_name || class_name.trim().length === 0) {
            return res.status(400).json({ error: 'Class name is required' });
        }

        try {
            const newClass = await classesService.createClass(class_name, teacher_id);

            res.status(201).json({
                message: 'Class created successfully',
                class: {
                    id: newClass.id,
                    class_code: newClass.class_code,
                    class_name: newClass.class_name,
                    created_at: newClass.created_at
                }
            });
        } catch (error) {
            console.error('Create class error:', error);
            res.status(500).json({ error: 'Server error while creating class' });
        }
    }

    /**
     * @route   POST /api/classes/join
     * @desc    Join a class using class code (Student only)
     * @access  Private - Student
     */
    async joinClass(req, res) {
        const { class_code } = req.body;
        const student_id = req.user.id;

        if (!class_code || class_code.trim().length === 0) {
            return res.status(400).json({ error: 'Class code is required' });
        }

        try {
            const result = await classesService.joinClass(class_code, student_id);

            if (result.error) {
                return res.status(result.status).json({ error: result.error });
            }

            res.json({
                message: 'Enrolled successfully',
                class: {
                    id: result.class.id,
                    class_code: result.class.class_code,
                    class_name: result.class.class_name
                }
            });
        } catch (error) {
            console.error('Join class error:', error);
            res.status(500).json({ error: 'Server error while joining class' });
        }
    }

    /**
     * @route   GET /api/classes/my-classes
     * @desc    Get all classes created by the teacher
     * @access  Private - Teacher
     */
    async getMyClasses(req, res) {
        const teacher_id = req.user.id;

        try {
            const classes = await classesService.getTeacherClasses(teacher_id);
            res.json({ classes });
        } catch (error) {
            console.error('Get teacher classes error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   GET /api/classes/enrolled
     * @desc    Get all classes student is enrolled in
     * @access  Private - Student
     */
    async getEnrolledClasses(req, res) {
        const student_id = req.user.id;

        try {
            const classes = await classesService.getStudentClasses(student_id);
            res.json({ classes });
        } catch (error) {
            console.error('Get enrolled classes error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   GET /api/classes
     * @desc    Get all available classes
     * @access  Private
     */
    async getAllClasses(req, res) {
        try {
            const classes = await classesService.getAllClasses();
            res.json({ classes });
        } catch (error) {
            console.error('Get all classes error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   GET /api/classes/:id
     * @desc    Get class details
     * @access  Private
     */
    async getClassDetails(req, res) {
        const class_id = req.params.id;

        try {
            const classData = await classesService.getClassById(class_id);

            if (!classData) {
                return res.status(404).json({ error: 'Class not found' });
            }

            res.json({ class: classData });
        } catch (error) {
            console.error('Get class details error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    /**
     * @route   GET /api/classes/:id/students
     * @desc    Get all students enrolled in a class
     * @access  Private - Teacher (must own the class)
     */
    async getClassStudents(req, res) {
        const class_id = req.params.id;
        const teacher_id = req.user.id;

        try {
            const result = await classesService.getClassStudents(class_id, teacher_id);

            if (result.error) {
                return res.status(result.status).json({ error: result.error });
            }

            res.json(result);
        } catch (error) {
            console.error('Get class students error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new ClassesController();
