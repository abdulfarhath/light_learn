const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const bcrypt = require("bcrypt");

async function setupDatabase() {
    console.log("🔧 Setting up database...");

    /** -----------------------------
     * 1. CREATE DATABASE (ignore if exists)
     * ------------------------------ */
    const adminPool = new Pool({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        database: "postgres",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
    });

    try {
        console.log(`📦 Creating database: ${process.env.DB_NAME}...`);
        await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log("✅ Database created successfully");
    } catch (error) {
        if (error.code === "42P04") {
            console.log("ℹ️  Database already exists");
        } else {
            console.error("❌ Error creating database:", error.message);
        }
    } finally {
        await adminPool.end();
    }

    /** -----------------------------
     * 2. CONNECT TO APP DATABASE
     * ------------------------------ */
    const appPool = new Pool({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
    });

    try {
        /** -----------------------------
         * A. RUN BASE SCHEMA SAFELY
         * ------------------------------ */
        console.log("📋 Running schema migrations...");

        let schema = fs.readFileSync(path.join(__dirname, "database", "schema.sql"), "utf-8");

        // Wrap schema execution in a safe block
        try {
            await appPool.query(schema);
        } catch (err) {
            if (err.code === "42710") {
                console.log("ℹ️ Trigger already exists. Skipping trigger creation...");
            } else {
                throw err;
            }
        }

        console.log("✅ Base schema created successfully");

        /** -----------------------------
         * ENSURE TRIGGER DOES NOT FAIL IF EXISTS
         * ------------------------------ */
        await appPool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
                ) THEN
                    CREATE TRIGGER update_users_updated_at
                    BEFORE UPDATE ON users
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                END IF;
            END$$;
        `);

        console.log("🔧 Safe trigger ensured");

        /** -----------------------------
         * B. UPDATE USERS TABLE
         * ------------------------------ */
        console.log("🔧 Updating users table...");
        await appPool.query(`
            ALTER TABLE IF EXISTS users
            ADD COLUMN IF NOT EXISTS year INTEGER,
            ADD COLUMN IF NOT EXISTS semester INTEGER,
            ADD COLUMN IF NOT EXISTS branch VARCHAR(100),
            ADD COLUMN IF NOT EXISTS college VARCHAR(255);
        `);
        console.log("✅ Users table updated");

        /** -----------------------------
         * C. TODOS TABLE
         * ------------------------------ */
        console.log("🔧 Creating todos table...");
        await appPool.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Todos table ready");

        /** -----------------------------
         * D. SUBJECTS SEED
         * ------------------------------ */
        console.log("🌱 Seeding subjects...");
        const subjects = [
            { name: "Data Structures", code: "CS201", year: 2, semester: 3, branch: "CSE", college: "Engineering College" },
            { name: "Digital Logic", code: "CS202", year: 2, semester: 3, branch: "CSE", college: "Engineering College" },
            { name: "Discrete Math", code: "CS203", year: 2, semester: 3, branch: "CSE", college: "Engineering College" },
            { name: "Thermodynamics", code: "ME201", year: 2, semester: 3, branch: "ME", college: "Engineering College" },
        ];

        for (const s of subjects) {
            await appPool.query(
                `
                INSERT INTO subjects (subject_name, subject_code, year, semester, branch, college)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (subject_code, college, branch, year, semester) DO NOTHING
            `,
                [s.name, s.code, s.year, s.semester, s.branch, s.college]
            );
        }

        console.log("✅ Subjects seeded");

        /** -----------------------------
         * E. SEED USERS
         * ------------------------------ */
        console.log("👤 Seeding users...");
        const passwordHash = await bcrypt.hash("password123", 10);

        // TEACHER
        const teacherRes = await appPool.query(
            `
            INSERT INTO users (email, password_hash, full_name, role)
            VALUES ($1, $2, $3, 'teacher')
            ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
            RETURNING id
        `,
            ["teacher@example.com", passwordHash, "John Professor"]
        );

        const teacherId = teacherRes.rows[0].id;

        // STUDENT
        await appPool.query(
            `
            INSERT INTO users (email, password_hash, full_name, role, branch, year, semester, college)
            VALUES ($1, $2, $3, 'student', 'CSE', 2, 3, 'Engineering College')
            ON CONFLICT (email) DO UPDATE SET
                branch = EXCLUDED.branch,
                year = EXCLUDED.year,
                semester = EXCLUDED.semester,
                college = EXCLUDED.college
        `,
            ["student@example.com", passwordHash, "Alice Student"]
        );

        console.log("✅ Users seeded");

        /** -----------------------------
         * F. COURSES
         * ------------------------------ */
        console.log("📚 Seeding classes...");
        const classes = [
            { code: "CS201-A", name: "Data Structures - Section A" },
            { code: "CS202-A", name: "Digital Logic - Section A" },
        ];

        for (const cls of classes) {
            await appPool.query(
                `
                INSERT INTO classes (class_code, class_name, teacher_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (class_code) DO NOTHING
            `,
                [cls.code, cls.name, teacherId]
            );
        }

        console.log("✅ Classes seeded");

        console.log("\n🎉 Database setup completed!\n");
        console.log("Credentials:");
        console.log(" Student → student@example.com / password123");
        console.log(" Teacher → teacher@example.com / password123");
        console.log("\nStart server using: npm run dev\n");
    } catch (error) {
        console.error("❌ Error setting up database:", error);
        process.exit(1);
    } finally {
        await appPool.end();
    }
}

setupDatabase();
