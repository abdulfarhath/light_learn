const teacherCoursesService = require('./teacher-courses.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/courses');

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only specific file types
    const allowedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.mp4', '.avi'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${ext} is not allowed`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

class TeacherCoursesController {
    /**
     * @route   POST /api/teacher-courses
     * @desc    Create a new course
     * @access  Private (Teacher only)
     */
    async createCourse(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const teacherId = req.user.id; // From auth middleware
            const course = await teacherCoursesService.createCourse(teacherId, req.body);

            res.status(201).json({
                message: 'Course created successfully',
                course
            });
        } catch (error) {
            console.error('Error creating course:', error);
            res.status(500).json({ error: 'Failed to create course' });
        }
    }

    /**
     * @route   GET /api/teacher-courses
     * @desc    Get all courses by logged-in teacher
     * @access  Private (Teacher only)
     */
    async getMyCourses(req, res) {
        try {
            const teacherId = req.user.id;
            const courses = await teacherCoursesService.getCoursesByTeacher(teacherId);

            res.json({ courses });
        } catch (error) {
            console.error('Error fetching courses:', error);
            res.status(500).json({ error: 'Failed to fetch courses' });
        }
    }

    /**
     * @route   GET /api/teacher-courses/:id
     * @desc    Get course by ID with all topics and materials
     * @access  Private
     */
    async getCourseById(req, res) {
        try {
            const course = await teacherCoursesService.getCourseById(req.params.id);

            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }

            // Check ownership if it's a draft? Or allow viewing?
            // For now, let's assume if it's draft, only owner can see.
            if (course.status === 'draft' && course.teacher_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json({ course });
        } catch (error) {
            console.error('Error fetching course:', error);
            res.status(500).json({ error: 'Failed to fetch course' });
        }
    }

    /**
     * @route   POST /api/teacher-courses/:id/topics
     * @desc    Add a topic to a course
     * @access  Private (Teacher only)
     */
    async addTopic(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Verify ownership
            const isOwner = await teacherCoursesService.verifyCourseOwnership(req.params.id, req.user.id);
            if (!isOwner) {
                return res.status(403).json({ error: 'Not authorized to modify this course' });
            }

            const topic = await teacherCoursesService.addTopic(req.params.id, req.body);

            res.status(201).json({
                message: 'Topic added successfully',
                topic
            });
        } catch (error) {
            console.error('Error adding topic:', error);
            res.status(500).json({ error: 'Failed to add topic' });
        }
    }

    /**
     * @route   POST /api/teacher-courses/topics/:topicId/materials
     * @desc    Add material to a topic
     * @access  Private (Teacher only)
     */
    async addMaterial(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Verify ownership via topic
            const isOwner = await teacherCoursesService.verifyTopicOwnership(req.params.topicId, req.user.id);
            if (!isOwner) {
                return res.status(403).json({ error: 'Not authorized to modify this course' });
            }

            const material = await teacherCoursesService.addMaterial(req.params.topicId, req.body);

            res.status(201).json({
                message: 'Material added successfully',
                material
            });
        } catch (error) {
            console.error('Error adding material:', error);
            res.status(500).json({ error: 'Failed to add material' });
        }
    }

    /**
     * @route   POST /api/teacher-courses/upload
     * @desc    Upload a file for course material
     * @access  Private (Teacher only)
     */
    uploadFile(req, res) {
        upload.single('file')(req, res, (err) => {
            if (err) {
                console.error('Upload error:', err);
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            res.json({
                message: 'File uploaded successfully',
                file: {
                    filename: req.file.filename,
                    originalname: req.file.originalname,
                    path: `/uploads/courses/${req.file.filename}`,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                }
            });
        });
    }

    /**
     * @route   PUT /api/teacher-courses/:id
     * @desc    Update course
     * @access  Private (Teacher only)
     */
    async updateCourse(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Verify ownership
            const isOwner = await teacherCoursesService.verifyCourseOwnership(req.params.id, req.user.id);
            if (!isOwner) {
                return res.status(403).json({ error: 'Not authorized to update this course' });
            }

            const course = await teacherCoursesService.updateCourse(req.params.id, req.body);

            res.json({
                message: 'Course updated successfully',
                course
            });
        } catch (error) {
            console.error('Error updating course:', error);
            res.status(500).json({ error: 'Failed to update course' });
        }
    }

    /**
     * @route   DELETE /api/teacher-courses/:id
     * @desc    Delete course
     * @access  Private (Teacher only)
     */
    async deleteCourse(req, res) {
        try {
            // Verify ownership
            const isOwner = await teacherCoursesService.verifyCourseOwnership(req.params.id, req.user.id);
            if (!isOwner) {
                return res.status(403).json({ error: 'Not authorized to delete this course' });
            }

            await teacherCoursesService.deleteCourse(req.params.id);

            res.json({ message: 'Course deleted successfully' });
        } catch (error) {
            console.error('Error deleting course:', error);
            res.status(500).json({ error: 'Failed to delete course' });
        }
    }

    /**
     * @route   DELETE /api/teacher-courses/topics/:id
     * @desc    Delete topic
     * @access  Private (Teacher only)
     */
    async deleteTopic(req, res) {
        try {
            // Verify ownership
            const isOwner = await teacherCoursesService.verifyTopicOwnership(req.params.id, req.user.id);
            if (!isOwner) {
                return res.status(403).json({ error: 'Not authorized to delete this topic' });
            }

            await teacherCoursesService.deleteTopic(req.params.id);

            res.json({ message: 'Topic deleted successfully' });
        } catch (error) {
            console.error('Error deleting topic:', error);
            res.status(500).json({ error: 'Failed to delete topic' });
        }
    }

    /**
     * @route   DELETE /api/teacher-courses/materials/:id
     * @desc    Delete material
     * @access  Private (Teacher only)
     */
    async deleteMaterial(req, res) {
        try {
            // Verify ownership
            const isOwner = await teacherCoursesService.verifyMaterialOwnership(req.params.id, req.user.id);
            if (!isOwner) {
                return res.status(403).json({ error: 'Not authorized to delete this material' });
            }

            await teacherCoursesService.deleteMaterial(req.params.id);

            res.json({ message: 'Material deleted successfully' });
        } catch (error) {
            console.error('Error deleting material:', error);
            res.status(500).json({ error: 'Failed to delete material' });
        }
    }
}

module.exports = new TeacherCoursesController();
