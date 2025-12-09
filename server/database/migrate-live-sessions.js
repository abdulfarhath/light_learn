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
        console.log('🔄 Starting live_sessions table migration...');

        // Create live_sessions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS live_sessions (
                id SERIAL PRIMARY KEY,
                room_id VARCHAR(255) NOT NULL UNIQUE,
                teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                focus_timer_seconds INTEGER DEFAULT 1500,
                focus_timer_active BOOLEAN DEFAULT FALSE,
                focus_timer_visible BOOLEAN DEFAULT TRUE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created live_sessions table');

        // Create indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_live_sessions_room_id ON live_sessions(room_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_live_sessions_teacher_id ON live_sessions(teacher_id);
        `);
        console.log('✅ Created indexes');

        // Create trigger function
        await client.query(`
            CREATE OR REPLACE FUNCTION update_live_sessions_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Created trigger function');

        // Create trigger
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_update_live_sessions_updated_at ON live_sessions;
        `);
        await client.query(`
            CREATE TRIGGER trigger_update_live_sessions_updated_at
                BEFORE UPDATE ON live_sessions
                FOR EACH ROW
                EXECUTE FUNCTION update_live_sessions_updated_at();
        `);
        console.log('✅ Created trigger');

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();

