const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function addRecordingsTable() {
    try {
        console.log('🔧 Adding recordings table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS recordings (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
                audio_url TEXT NOT NULL,
                events_url TEXT NOT NULL,
                pdf_url TEXT,
                duration INTEGER, -- in seconds
                thumbnail_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_recordings_teacher_id ON recordings(teacher_id);
            CREATE INDEX IF NOT EXISTS idx_recordings_class_id ON recordings(class_id);
        `);

        console.log('✅ Recordings table created successfully');
    } catch (error) {
        console.error('❌ Error adding recordings table:', error);
    } finally {
        await pool.end();
    }
}

addRecordingsTable();
