const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function updateUsersTable() {
    try {
        console.log('🔧 Updating users table...');

        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS year INTEGER,
            ADD COLUMN IF NOT EXISTS semester INTEGER,
            ADD COLUMN IF NOT EXISTS branch VARCHAR(100),
            ADD COLUMN IF NOT EXISTS college VARCHAR(255);
        `);

        console.log('✅ Users table updated successfully');
    } catch (error) {
        console.error('❌ Error updating users table:', error);
    } finally {
        await pool.end();
    }
}

updateUsersTable();
