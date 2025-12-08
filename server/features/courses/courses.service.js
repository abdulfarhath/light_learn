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
}

module.exports = new CoursesService();
