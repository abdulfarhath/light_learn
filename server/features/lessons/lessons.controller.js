const lessonsService = require('./lessons.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../storage/recordings');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

class LessonsController {
    constructor() {
        this.uploadMiddleware = upload.fields([
            { name: 'audio', maxCount: 1 },
            { name: 'events', maxCount: 1 },
            { name: 'pdf', maxCount: 1 }
        ]);
    }

    async uploadLesson(req, res) {
        try {
            const { title, duration, teacher_id, class_id } = req.body;
            const files = req.files;

            if (!files.audio || !files.events) {
                return res.status(400).json({ message: 'Audio and events files are required' });
            }

            const audioUrl = `/storage/recordings/${files.audio[0].filename}`;
            const eventsUrl = `/storage/recordings/${files.events[0].filename}`;
            const pdfUrl = files.pdf ? `/storage/recordings/${files.pdf[0].filename}` : null;

            const lesson = await lessonsService.createLesson({
                title,
                description: '', // Optional
                teacher_id,
                class_id: class_id || null,
                audio_url: audioUrl,
                events_url: eventsUrl,
                pdf_url: pdfUrl,
                duration
            });

            res.status(201).json(lesson);
        } catch (error) {
            console.error('Error uploading lesson:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getLesson(req, res) {
        try {
            const lesson = await lessonsService.getLessonById(req.params.id);
            if (!lesson) {
                return res.status(404).json({ message: 'Lesson not found' });
            }
            res.json(lesson);
        } catch (error) {
            console.error('Error fetching lesson:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getTeacherLessons(req, res) {
        try {
            const teacherId = req.user.id; 
            const lessons = await lessonsService.getLessonsByTeacher(teacherId);
            res.json(lessons);
        } catch (error) {
            console.error('Error fetching teacher lessons:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getStudentLessons(req, res) {
        try {
            // For now, return all lessons. In a real app, filter by enrolled classes.
            // Since we don't have enrollment logic fully integrated here yet, 
            // we'll just return all lessons so the student can see something.
            // Ideally: const lessons = await lessonsService.getLessonsForStudent(req.user.id);
            const lessons = await lessonsService.getAllLessons();
            res.json(lessons);
        } catch (error) {
            console.error('Error fetching student lessons:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new LessonsController();
