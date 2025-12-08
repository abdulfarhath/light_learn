const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update role constraint to allow 'bot'
        console.log('Updating role constraint...');
        await client.query(`
            ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
            ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('teacher', 'student', 'bot'));
        `);

        // 2. Insert AI Bot user
        console.log('Creating AI Bot user...');
        const checkBot = await client.query("SELECT id FROM users WHERE email = 'ai.bot@lightlearn.com'");
        
        if (checkBot.rows.length === 0) {
            await client.query(`
                INSERT INTO users (email, password_hash, full_name, role)
                VALUES ($1, $2, $3, $4)
            `, ['ai.bot@lightlearn.com', 'dummy_hash_no_login', 'AI Assistant', 'bot']);
            console.log('AI Bot user created.');
        } else {
            console.log('AI Bot user already exists.');
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
