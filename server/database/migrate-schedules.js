const pool = require('../shared/config/database');

async function migrateSchedules() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Starting schedules migration...');
        
        await client.query('BEGIN');
        
        // Create polls table
        await client.query(`
            CREATE TABLE IF NOT EXISTS polls (
                id SERIAL PRIMARY KEY,
                class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
                subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
                title VARCHAR(255) NOT NULL,
                question TEXT NOT NULL,
                options JSONB NOT NULL,
                created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                deadline TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Polls table created');
        
        // Create indexes for polls
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_polls_class_id ON polls(class_id);
            CREATE INDEX IF NOT EXISTS idx_polls_subject_id ON polls(subject_id);
            CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
        `);
        
        // Create poll_responses table
        await client.query(`
            CREATE TABLE IF NOT EXISTS poll_responses (
                id SERIAL PRIMARY KEY,
                poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
                student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                selected_option INTEGER NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(poll_id, student_id)
            );
        `);
        console.log('✅ Poll responses table created');
        
        // Create indexes for poll_responses
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);
            CREATE INDEX IF NOT EXISTS idx_poll_responses_student_id ON poll_responses(student_id);
        `);
        
        // Create assignments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id SERIAL PRIMARY KEY,
                class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
                subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                deadline TIMESTAMP NOT NULL,
                max_score INTEGER DEFAULT 100,
                created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Assignments table created');
        
        // Create indexes for assignments
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
            CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON assignments(subject_id);
            CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
            CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON assignments(deadline);
        `);
        
        // Create assignment_submissions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS assignment_submissions (
                id SERIAL PRIMARY KEY,
                assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
                student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                submission_text TEXT,
                file_url VARCHAR(500),
                score INTEGER,
                feedback TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                graded_at TIMESTAMP,
                UNIQUE(assignment_id, student_id)
            );
        `);
        console.log('✅ Assignment submissions table created');
        
        // Create indexes for assignment_submissions
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
            CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
        `);
        
        // Update quizzes table
        await client.query(`
            ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL;
            ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
            ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
            ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log('✅ Quizzes table updated');
        
        // Create indexes for quizzes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON quizzes(subject_id);
            CREATE INDEX IF NOT EXISTS idx_quizzes_deadline ON quizzes(deadline);
        `);
        
        // Create triggers
        await client.query(`
            DROP TRIGGER IF EXISTS update_polls_updated_at ON polls;
            CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON polls
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
            CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
            CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
        console.log('✅ Triggers created');
        
        await client.query('COMMIT');
        console.log('✅ Migration completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrateSchedules();

