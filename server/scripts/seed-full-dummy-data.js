const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function seedFullDummyData() {
    try {
        console.log('🌱 Starting full database seed...');

        // --- 1. USERS ---
        console.log('Creating Users...');
        const passwordHash = await bcrypt.hash('password123', 10);
        
        const users = [
            // Teachers
            { email: 'teacher1@example.com', name: 'John Smith', role: 'teacher', bio: 'Math Expert' },
            { email: 'teacher2@example.com', name: 'Sarah Johnson', role: 'teacher', bio: 'Physics Professor' },
            // Students
            { email: 'student1@example.com', name: 'Mike Brown', role: 'student', year: 2, semester: 3, branch: 'CSE', college: 'Engineering College' },
            { email: 'student2@example.com', name: 'Emily Davis', role: 'student', year: 2, semester: 3, branch: 'CSE', college: 'Engineering College' },
            { email: 'student3@example.com', name: 'Chris Wilson', role: 'student', year: 3, semester: 5, branch: 'ME', college: 'Engineering College' },
        ];

        const userIds = {}; // Map email -> id

        for (const u of users) {
            const res = await pool.query(`
                INSERT INTO users (email, password_hash, full_name, role, bio, year, semester, branch, college)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (email) DO UPDATE 
                SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
                RETURNING id, email, role
            `, [u.email, passwordHash, u.name, u.role, u.bio, u.year, u.semester, u.branch, u.college]);
            userIds[u.email] = res.rows[0].id;
        }
        console.log('✅ Users created');

        // --- 2. CLASSES ---
        console.log('Creating Classes...');
        const classes = [
            { code: 'MATH101', name: 'Advanced Mathematics', teacher: 'teacher1@example.com' },
            { code: 'PHY202', name: 'Quantum Physics', teacher: 'teacher2@example.com' },
            { code: 'CS303', name: 'Data Structures', teacher: 'teacher1@example.com' },
        ];

        const classIds = {}; // Map code -> id

        for (const c of classes) {
            const res = await pool.query(`
                INSERT INTO classes (class_code, class_name, teacher_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (class_code) DO UPDATE
                SET class_name = EXCLUDED.class_name
                RETURNING id, class_code
            `, [c.code, c.name, userIds[c.teacher]]);
            classIds[c.code] = res.rows[0].id;
        }
        console.log('✅ Classes created');

        // --- 3. ENROLLMENTS ---
        console.log('Enrolling Students...');
        const enrollments = [
            { student: 'student1@example.com', class: 'MATH101' },
            { student: 'student1@example.com', class: 'CS303' },
            { student: 'student2@example.com', class: 'MATH101' },
            { student: 'student2@example.com', class: 'PHY202' },
            { student: 'student3@example.com', class: 'PHY202' },
        ];

        for (const e of enrollments) {
            await pool.query(`
                INSERT INTO enrollments (student_id, class_id)
                VALUES ($1, $2)
                ON CONFLICT (student_id, class_id) DO NOTHING
            `, [userIds[e.student], classIds[e.class]]);
        }
        console.log('✅ Enrollments created');

        // --- 4. SUBJECTS (For Courses Feature) ---
        console.log('Creating Subjects...');
        const subjects = [
            { name: 'Data Structures', code: 'CS201', year: 2, semester: 3, branch: 'CSE', college: 'Engineering College' },
            { name: 'Digital Logic', code: 'CS202', year: 2, semester: 3, branch: 'CSE', college: 'Engineering College' },
            { name: 'Thermodynamics', code: 'ME201', year: 3, semester: 5, branch: 'ME', college: 'Engineering College' },
        ];

        for (const s of subjects) {
            await pool.query(`
                INSERT INTO subjects (subject_name, subject_code, year, semester, branch, college)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (subject_code, college, branch, year, semester) DO NOTHING
            `, [s.name, s.code, s.year, s.semester, s.branch, s.college]);
        }
        console.log('✅ Subjects created');

        // --- 5. TODOS ---
        console.log('Creating Todos...');
        const todos = [
            { user: 'student1@example.com', text: 'Complete Math Assignment', completed: false },
            { user: 'student1@example.com', text: 'Read Physics Chapter 4', completed: true },
            { user: 'teacher1@example.com', text: 'Grade CS303 Midterms', completed: false },
        ];

        for (const t of todos) {
            await pool.query(`
                INSERT INTO todos (user_id, text, completed)
                VALUES ($1, $2, $3)
            `, [userIds[t.user], t.text, t.completed]);
        }
        console.log('✅ Todos created');

        // --- 6. DOUBTS ---
        console.log('Creating Doubts...');
        const doubts = [
            { student: 'student1@example.com', class: 'MATH101', title: 'Integration Help', desc: 'How do I integrate x^2 * e^x?', status: 'unresolved' },
            { student: 'student2@example.com', class: 'PHY202', title: 'Schrodinger Equation', desc: 'What is psi?', status: 'resolved' },
        ];

        for (const d of doubts) {
            const res = await pool.query(`
                INSERT INTO doubts (student_id, class_id, title, description, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, [userIds[d.student], classIds[d.class], d.title, d.desc, d.status]);
            
            // Add answer if resolved
            if (d.status === 'resolved') {
                await pool.query(`
                    INSERT INTO doubt_answers (doubt_id, author_id, content)
                    VALUES ($1, $2, $3)
                `, [res.rows[0].id, userIds['teacher2@example.com'], 'Psi represents the wave function of the quantum system.']);
            }
        }
        console.log('✅ Doubts created');

        // --- 7. QUIZZES ---
        console.log('Creating Quizzes...');
        const quizData = {
            title: 'Basic Calculus',
            questions: [
                { id: 1, text: 'What is the derivative of x^2?', options: ['x', '2x', 'x^2', '2'], correct: 1 },
                { id: 2, text: 'Integral of 1/x?', options: ['ln(x)', 'e^x', '1/x^2', '0'], correct: 0 }
            ]
        };

        await pool.query(`
            INSERT INTO quizzes (class_id, title, questions, created_by)
            VALUES ($1, $2, $3, $4)
        `, [classIds['MATH101'], quizData.title, JSON.stringify(quizData.questions), userIds['teacher1@example.com']]);
        console.log('✅ Quizzes created');

        console.log('🎉 Full database seed completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await pool.end();
    }
}

seedFullDummyData();
