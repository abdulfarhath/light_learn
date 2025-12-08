const pool = require('../../shared/config/database');

class CoursesService {
    /**
     * Get subjects by filters (year, semester, branch, college)
     */
    async getSubjectsByFilters(filters) {
        const { year, semester, branch, college } = filters;

        console.log("Running DB Query With Filters:", filters);

        const result = await pool.query(
            `SELECT *
             FROM subjects
             WHERE year = $1
               AND semester = $2
               AND LOWER(branch) = LOWER($3)
               AND LOWER(college) = LOWER($4)
             ORDER BY subject_name ASC`,
            [year, semester, branch, college]
        );

        return result.rows;
    }

    async createSubject(subjectData) {
        const { subject_name, subject_code, year, semester, branch, college } = subjectData;
        const query = `
            INSERT INTO subjects (subject_name, subject_code, year, semester, branch, college)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(query, [subject_name, subject_code, year, semester, branch, college]);
        return result.rows[0];
    }
}

module.exports = new CoursesService();
