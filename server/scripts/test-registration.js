const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function testRegistration() {
    try {
        console.log('🧪 Testing Registration API...');

        const newUser = {
            email: `test_student_${Date.now()}@example.com`,
            password: 'password123',
            full_name: 'Test Student',
            role: 'student',
            year: 2,
            semester: 3,
            branch: 'CSE',
            college: 'Engineering College'
        };

        // 1. Register User
        const API_URL = `http://localhost:3004/api/auth/register`; // Using port 3004 as it's running
        console.log(`📡 Registering user: ${newUser.email}`);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Registration Error:', response.status, errorText);
            return;
        }

        const data = await response.json();
        console.log('✅ Registration Successful:', data.message);
        console.log('   User ID:', data.user.id);

        // 2. Verify in Database
        const dbRes = await pool.query('SELECT * FROM users WHERE id = $1', [data.user.id]);
        const dbUser = dbRes.rows[0];

        console.log('🔍 Database Verification:');
        console.log(`   Year: ${dbUser.year} (Expected: ${newUser.year})`);
        console.log(`   Semester: ${dbUser.semester} (Expected: ${newUser.semester})`);
        console.log(`   Branch: ${dbUser.branch} (Expected: ${newUser.branch})`);
        console.log(`   College: ${dbUser.college} (Expected: ${newUser.college})`);

        if (dbUser.year === newUser.year &&
            dbUser.semester === newUser.semester &&
            dbUser.branch === newUser.branch &&
            dbUser.college === newUser.college) {
            console.log('✅ Data matches!');
        } else {
            console.error('❌ Data mismatch!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

testRegistration();
