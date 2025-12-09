const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function createMissingTables() {
    try {
        console.log('Creating missing tables...');
        
        // Quizzes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS quizzes (
                id SERIAL PRIMARY KEY,
                class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                questions JSONB NOT NULL,
                created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_quizzes_class_id ON quizzes(class_id);
        `);
        console.log('✅ Quizzes table created');

        // Quiz Responses
        await pool.query(`
            CREATE TABLE IF NOT EXISTS quiz_responses (
                id SERIAL PRIMARY KEY,
                quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
                student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                answers JSONB NOT NULL,
                score INTEGER,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(quiz_id, student_id)
            );
        `);
        console.log('✅ Quiz Responses table created');

        // Resources
        await pool.query(`
            CREATE TABLE IF NOT EXISTS resources (
                id SERIAL PRIMARY KEY,
                class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                file_size INTEGER,
                file_type VARCHAR(100),
                file_data BYTEA,
                uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Resources table created');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

createMissingTables();
