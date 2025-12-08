const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function addTodosTable() {
    try {
        console.log('🔧 Adding todos table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);

            DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
            CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log('✅ Todos table created successfully');
    } catch (error) {
        console.error('❌ Error adding todos table:', error);
    } finally {
        await pool.end();
    }
}

addTodosTable();
