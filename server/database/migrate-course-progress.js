const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'light_learn',
    password: process.env.DB_PASSWORD || 'sharkzuu',
    port: process.env.DB_PORT || 5432,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting course_progress table migration...');

        // Create course_progress table
        await client.query(`
            CREATE TABLE IF NOT EXISTS course_progress (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                topic_id INTEGER NOT NULL,
                completed BOOLEAN DEFAULT TRUE,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(student_id, subject_id, topic_id)
            );
        `);
        console.log('✅ Created course_progress table');

        // Create indexes for faster queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_course_progress_student_id ON course_progress(student_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_course_progress_subject_id ON course_progress(subject_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_course_progress_student_subject ON course_progress(student_id, subject_id);
        `);
        console.log('✅ Created indexes');

        console.log('🎉 Course progress migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();

