const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function addProfileColumns() {
    try {
        console.log('🔧 Adding profile columns to users table...');

        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
            ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS year INTEGER,
            ADD COLUMN IF NOT EXISTS semester INTEGER,
            ADD COLUMN IF NOT EXISTS branch VARCHAR(100),
            ADD COLUMN IF NOT EXISTS college VARCHAR(255);
        `);

        console.log('✅ Users table updated with profile columns');
    } catch (error) {
        console.error('❌ Error updating users table:', error);
    } finally {
        await pool.end();
    }
}

addProfileColumns();
