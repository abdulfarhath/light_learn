const { Pool } = require('pg');
require('dotenv').config();

async function migrateAddProfileFields() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'learning_platform',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    try {
        console.log('🔄 Running migration: Adding profile fields to users table...');

        // Check if columns already exist
        const checkQuery = `
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='users' AND column_name='year'
        `;
        const result = await pool.query(checkQuery);

        if (result.rows.length > 0) {
            console.log('ℹ️  Profile fields already exist in users table');
            return;
        }

        // Add missing columns
        const migrationQuery = `
            ALTER TABLE users
            ADD COLUMN year INTEGER,
            ADD COLUMN semester INTEGER,
            ADD COLUMN branch VARCHAR(100),
            ADD COLUMN college VARCHAR(255);
        `;

        await pool.query(migrationQuery);
        console.log('✅ Migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrateAddProfileFields();
