const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function seedData() {
    try {
        console.log('🌱 Seeding data...');

        // 1. Insert Subjects
        const subjects = [
            { name: 'Data Structures', code: 'CS201', year: 2, semester: 3, branch: 'CSE', college: 'Engineering College' },
            { name: 'Digital Logic', code: 'CS202', year: 2, semester: 3, branch: 'CSE', college: 'Engineering College' },
            { name: 'Discrete Math', code: 'CS203', year: 2, semester: 3, branch: 'CSE', college: 'Engineering College' },
            { name: 'Thermodynamics', code: 'ME201', year: 2, semester: 3, branch: 'ME', college: 'Engineering College' }
        ];

        for (const sub of subjects) {
            await pool.query(`
                INSERT INTO subjects (subject_name, subject_code, year, semester, branch, college)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (subject_code, college, branch, year, semester) DO NOTHING
            `, [sub.name, sub.code, sub.year, sub.semester, sub.branch, sub.college]);
        }
        console.log('✅ Subjects seeded');

        // 2. Update a User (assuming user with id 1 exists, or we pick the first student)
        const userRes = await pool.query("SELECT id FROM users WHERE role = 'student' LIMIT 1");

        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            await pool.query(`
                UPDATE users 
                SET year = 2, semester = 3, branch = 'CSE', college = 'Engineering College'
                WHERE id = $1
            `, [userId]);
            console.log(`✅ Updated user ${userId} with profile details`);
        } else {
            console.log('⚠️ No student user found to update');
        }

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await pool.end();
    }
}

seedData();
