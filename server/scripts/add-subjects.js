const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function addSubjectsTable() {
    try {
        console.log('🔧 Adding subjects table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                subject_name VARCHAR(255) NOT NULL,
                subject_code VARCHAR(50) NOT NULL,
                year INTEGER NOT NULL,
                semester INTEGER NOT NULL,
                branch VARCHAR(100) NOT NULL,
                college VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(subject_code, college, branch, year, semester)
            );

            CREATE INDEX IF NOT EXISTS idx_subjects_college_branch ON subjects(college, branch);
            CREATE INDEX IF NOT EXISTS idx_subjects_year_semester ON subjects(year, semester);

            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
            CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log('✅ Subjects table created successfully');
    } catch (error) {
        console.error('❌ Error adding subjects table:', error);
    } finally {
        await pool.end();
    }
}

addSubjectsTable();
