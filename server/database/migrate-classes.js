const pool = require('../shared/config/database');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runClassMigration() {
    console.log('🔧 Running class management schema migration...');

    try {
        const schemaPath = path.join(__dirname, 'class_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        await pool.query(schema);
        console.log('✅ Classes and enrollments tables created successfully');

        // Verify tables were created
        const result = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('classes', 'class_enrollments')
    `);
        console.log('📊 Tables created:', result.rows.map(r => r.tablename).join(', '));

        console.log('\n✅ Class management migration complete!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running migration:', error.message);
        process.exit(1);
    }
}

runClassMigration();
