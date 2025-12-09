const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function testApi() {
    try {
        console.log('🧪 Testing Courses API...');

        // 1. Get User 2
        const userRes = await pool.query("SELECT * FROM users WHERE id = 2");
        if (userRes.rows.length === 0) {
            console.error('❌ User 2 not found');
            return;
        }
        const user = userRes.rows[0];
        console.log(`👤 Testing with user: ${user.email} (Role: ${user.role})`);
        console.log(`   Profile: Year ${user.year}, Sem ${user.semester}, ${user.branch}, ${user.college}`);

        // 2. Generate Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' }
        );

        // 3. Make API Request
        const API_URL = `http://localhost:3003/api/courses/subjects`;
        console.log(`📡 Requesting: ${API_URL}`);

        const response = await fetch(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Response Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            return;
        }

        const data = await response.json();
        console.log('📦 Subjects Received:', data.subjects.length);
        data.subjects.forEach(sub => {
            console.log(`   - ${sub.subject_code}: ${sub.subject_name}`);
        });

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    } finally {
        await pool.end();
    }
}

testApi();
