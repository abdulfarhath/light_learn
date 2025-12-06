const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function reproduceError() {
    try {
        console.log('🧪 Reproducing Teacher Registration Error...');

        const newTeacher = {
            email: `test_teacher_${Date.now()}@example.com`,
            password: 'password123',
            full_name: 'Test Teacher',
            role: 'teacher',
            year: '',      // This causes the error
            semester: '',  // This also causes error
            branch: '',
            college: ''
        };

        // 1. Register Teacher
        const API_URL = `http://localhost:3005/api/auth/register`; // Using port 3005
        console.log(`📡 Registering teacher: ${newTeacher.email}`);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTeacher)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Registration Error:', response.status, errorText);
        } else {
            const data = await response.json();
            console.log('✅ Registration Successful:', data.message);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

reproduceError();
