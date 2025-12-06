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

async function testTodosApi() {
    try {
        console.log('🧪 Testing Todos API...');

        // 1. Get a User
        const userRes = await pool.query("SELECT * FROM users WHERE role = 'student' LIMIT 1");
        if (userRes.rows.length === 0) {
            console.error('❌ No student user found');
            return;
        }
        const user = userRes.rows[0];
        console.log(`👤 Testing with user: ${user.email}`);

        // 2. Generate Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' }
        );

        const API_URL = `http://localhost:3006/api/todos`; // Using port 3006
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 3. Create Todo
        console.log('📝 Creating Todo...');
        const createRes = await fetch(API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({ text: 'Test Todo Item' })
        });
        const createData = await createRes.json();
        console.log('   Response:', createRes.status, createData);
        const todoId = createData.todo.id;

        // 4. Get Todos
        console.log('📋 Fetching Todos...');
        const getRes = await fetch(API_URL, { headers });
        const getData = await getRes.json();
        console.log('   Todos count:', getData.todos.length);

        // 5. Toggle Todo
        console.log('✅ Toggling Todo...');
        const toggleRes = await fetch(`${API_URL}/${todoId}/toggle`, {
            method: 'PUT',
            headers
        });
        const toggleData = await toggleRes.json();
        console.log('   New Status:', toggleData.todo.completed);

        // 6. Delete Todo
        console.log('🗑️ Deleting Todo...');
        const deleteRes = await fetch(`${API_URL}/${todoId}`, {
            method: 'DELETE',
            headers
        });
        console.log('   Response:', deleteRes.status);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

testTodosApi();
