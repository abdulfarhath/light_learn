const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'learning_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

class CoursesService {
    async getSubjectsByFilters(filters) {
        const { year, semester, branch, college } = filters;

        const query = `
            SELECT * FROM subjects 
            WHERE year = $1 
            AND semester = $2 
            AND branch = $3 
            AND college = $4
        `;

        const result = await pool.query(query, [year, semester, branch, college]);
        return result.rows;
    }

    async getAllSubjects() {
        const result = await pool.query('SELECT * FROM subjects');
        return result.rows;
    }
}

module.exports = new CoursesService();
