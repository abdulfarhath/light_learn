const pool = require('../../shared/config/database');

class CoursesService {
    /**
     * Get all subjects (no filters)
     */
    async getAllSubjects() {
        const result = await pool.query(
            `SELECT *
             FROM subjects
             ORDER BY subject_name ASC`
        );
        return result.rows;
    }

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

    async getAllSubjects() {
        const result = await pool.query(
            `SELECT * FROM subjects ORDER BY subject_name ASC`
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

    /**
     * Get subject by ID
     */
    async getSubjectById(subject_id) {
        const result = await pool.query(
            'SELECT * FROM subjects WHERE id = $1',
            [subject_id]
        );
        return result.rows[0];
    }

    /**
     * Update subject
     */
    async updateSubject(subject_id, updates) {
        const { subject_name, subject_code, year, semester, branch, college } = updates;

        const result = await pool.query(
            `UPDATE subjects
             SET subject_name = COALESCE($1, subject_name),
                 subject_code = COALESCE($2, subject_code),
                 year = COALESCE($3, year),
                 semester = COALESCE($4, semester),
                 branch = COALESCE($5, branch),
                 college = COALESCE($6, college)
             WHERE id = $7
             RETURNING *`,
            [subject_name, subject_code, year, semester, branch, college, subject_id]
        );

        return result.rows[0];
    }

    /**
     * Delete subject
     */
    async deleteSubject(subject_id) {
        await pool.query('DELETE FROM subjects WHERE id = $1', [subject_id]);
    }
}

module.exports = new CoursesService();
