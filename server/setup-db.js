const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log('🔧 Setting up database...');

    // First, connect to postgres database to create our app database
    const adminPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    try {
        // Create database if it doesn't exist
        console.log(`📦 Creating database: ${process.env.DB_NAME}...`);
        await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log('✅ Database created successfully');
    } catch (error) {
        if (error.code === '42P04') {
            console.log('ℹ️  Database already exists');
        } else {
            console.error('❌ Error creating datssase:', error.message);
        }
    } finally {
        await adminPool.end();
    }

    // Now connect to our app database and run schema
    const appPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'learning_platform',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    try {
        console.log('📋 Running schema migrations...');
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        await appPool.query(schema);
        console.log('✅ Schema created successfully');

        // Verify tables were created
        const result = await appPool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
        console.log('📊 Tables created:', result.rows.map(r => r.tablename).join(', '));

        console.log('\n✅ Database setup complete!');
        console.log('You can now start the server with: npm run dev\n');
    } catch (error) {
        console.error('❌ Error setting up schema:', error.message);
        process.exit(1);
    } finally {
        await appPool.end();
    }
}

setupDatabase();
