const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

const colleges = ['Engineering College', 'Institute of Technology'];
const branches = ['CSE', 'ECE', 'ME', 'CE'];

const subjectsData = [
    // CSE - Sem 3
    { name: 'Data Structures', code: 'CS301', year: 2, semester: 3, branch: 'CSE' },
    { name: 'Digital Logic Design', code: 'CS302', year: 2, semester: 3, branch: 'CSE' },
    { name: 'Discrete Mathematics', code: 'CS303', year: 2, semester: 3, branch: 'CSE' },
    { name: 'Object Oriented Programming', code: 'CS304', year: 2, semester: 3, branch: 'CSE' },

    // CSE - Sem 4
    { name: 'Algorithms', code: 'CS401', year: 2, semester: 4, branch: 'CSE' },
    { name: 'Operating Systems', code: 'CS402', year: 2, semester: 4, branch: 'CSE' },
    { name: 'Database Management Systems', code: 'CS403', year: 2, semester: 4, branch: 'CSE' },

    // CSE - Sem 5
    { name: 'Computer Networks', code: 'CS501', year: 3, semester: 5, branch: 'CSE' },
    { name: 'Software Engineering', code: 'CS502', year: 3, semester: 5, branch: 'CSE' },
    { name: 'Theory of Computation', code: 'CS503', year: 3, semester: 5, branch: 'CSE' },

    // ECE - Sem 3
    { name: 'Electronic Devices', code: 'EC301', year: 2, semester: 3, branch: 'ECE' },
    { name: 'Network Theory', code: 'EC302', year: 2, semester: 3, branch: 'ECE' },
    { name: 'Signals and Systems', code: 'EC303', year: 2, semester: 3, branch: 'ECE' },

    // ME - Sem 3
    { name: 'Thermodynamics', code: 'ME301', year: 2, semester: 3, branch: 'ME' },
    { name: 'Fluid Mechanics', code: 'ME302', year: 2, semester: 3, branch: 'ME' },
    { name: 'Material Science', code: 'ME303', year: 2, semester: 3, branch: 'ME' },
];

async function seedMoreData() {
    try {
        console.log('🌱 Seeding comprehensive data...');

        // 1. Insert Subjects
        for (const sub of subjectsData) {
            // Insert for both colleges
            for (const college of colleges) {
                await pool.query(`
                    INSERT INTO subjects (subject_name, subject_code, year, semester, branch, college)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (subject_code, college, branch, year, semester) 
                    DO UPDATE SET subject_name = EXCLUDED.subject_name
                `, [sub.name, sub.code, sub.year, sub.semester, sub.branch, college]);
            }
        }
        console.log(`✅ Seeded ${subjectsData.length * colleges.length} subjects`);

        // 2. Update Users
        // Update ALL students to CSE, Year 2, Sem 3 for testing purposes
        await pool.query(`
            UPDATE users 
            SET year = 2, semester = 3, branch = 'CSE', college = 'Engineering College'
            WHERE role = 'student'
        `);
        console.log('✅ Updated ALL student profiles to: CSE, Year 2, Sem 3, Engineering College');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await pool.end();
    }
}

seedMoreData();
