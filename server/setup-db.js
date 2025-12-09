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
        console.log(`📦 Creating database: ${process.env.DB_NAME} (if not exists)...`);
        await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log("✅ Database created successfully");
    } catch (error) {
        if (error.code === "42P04") {
            console.log("ℹ️  Database already exists, using existing database");
        } else {
            console.error("❌ Error creating database:", error.message);
            throw error;
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
         * A. RUN BASE SCHEMA
         * ------------------------------ */
        console.log("📋 Running schema migrations...");

        let schema = fs.readFileSync(path.join(__dirname, "database", "schema.sql"), "utf-8");
        await appPool.query(schema);

        console.log("✅ All tables created successfully");

        /** -----------------------------
         * B. SEED SUBJECTS
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
         * C. SEED USERS
         * ------------------------------ */
        console.log("👤 Seeding users...");
        const passwordHash = await bcrypt.hash("password123", 10);

        // TEACHER (in teachers table)
        console.log("  → Creating teacher account...");
        await appPool.query(
            `
            INSERT INTO teachers (email, password_hash, full_name, department)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO UPDATE SET 
                full_name = EXCLUDED.full_name,
                department = EXCLUDED.department
        `,
            ["teacher@example.com", passwordHash, "John Professor", "Computer Science"]
        );
        console.log("  ✅ Teacher account created");

        // STUDENT (in users table)
        console.log("  → Creating student account...");
        await appPool.query(
            `
            INSERT INTO users (email, password_hash, full_name, branch, year, semester, college)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (email) DO UPDATE SET
                branch = EXCLUDED.branch,
                year = EXCLUDED.year,
                semester = EXCLUDED.semester,
                college = EXCLUDED.college
        `,
            ["student@example.com", passwordHash, "Alice Student", "CSE", 2, 3, "Engineering College"]
        );
        console.log("  ✅ Student account created");

        console.log("\n🎉 Database setup completed!\n");
        console.log("Credentials:");
        console.log(" Student → student@example.com / password123");
        console.log(" Teacher → teacher@example.com / password123");
        console.log("\nStart server using: npm run dev\n");

    } catch (error) {
        console.error("❌ Error setting up database:", error);
        throw error;
    } finally {
        await appPool.end();
    }
}

setupDatabase()
    .then(() => {
        console.log("✅ Setup finished successfully");
        process.exit(0);
    })
    .catch((err) => {
        console.error("💥 Setup failed:", err);
        process.exit(1);
    });
