const db = require('../../shared/config/database');
const aiService = require('../ai/ai.service');

const getAllDoubts = async () => {
    const query = `
        SELECT d.*, d.created_at as timestamp, u.full_name as "studentName", c.class_name as "course", t.full_name as "teacherName",
        (SELECT json_agg(
            json_build_object(
                'id', da.id,
                'content', da.content,
                'authorName', u2.full_name,
                'role', u2.role,
                'timestamp', da.created_at,
                'type', 'text' -- Default to text for now
            ) ORDER BY da.created_at ASC
        ) FROM doubt_answers da 
        JOIN users u2 ON da.author_id = u2.id 
        WHERE da.doubt_id = d.id) as answers
        FROM doubts d
        JOIN users u ON d.student_id = u.id
        LEFT JOIN classes c ON d.class_id = c.id
        LEFT JOIN users t ON c.teacher_id = t.id
        ORDER BY d.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows.map(row => ({
        ...row,
        answers: row.answers || []
    }));
};

const createDoubt = async (studentId, doubtData) => {
    const { title, description, classId } = doubtData;
    
    // Handle empty string for classId (convert to null)
    const classIdValue = (classId === '' || classId === undefined) ? null : classId;

    const query = `
        INSERT INTO doubts (student_id, title, description, class_id, status)
        VALUES ($1, $2, $3, $4, 'unresolved')
        RETURNING *
    `;
    const result = await db.query(query, [studentId, title, description, classIdValue]); 
    
    // Trigger AI Answer (Fire and forget)
    const newDoubt = result.rows[0];
    aiService.generateAnswer(newDoubt.id, title, description);

    return newDoubt;
};

const addAnswer = async (doubtId, authorId, content) => {
    const query = `
        INSERT INTO doubt_answers (doubt_id, author_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const result = await db.query(query, [doubtId, authorId, content]);
    return result.rows[0];
};

const updateStatus = async (doubtId, status) => {
    const query = `
        UPDATE doubts
        SET status = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `;
    const result = await db.query(query, [doubtId, status]);
    return result.rows[0];
};

const getDoubtById = async (doubtId) => {
    const query = `SELECT * FROM doubts WHERE id = $1`;
    const result = await db.query(query, [doubtId]);
    return result.rows[0];
};

module.exports = { getAllDoubts, createDoubt, addAnswer, updateStatus, getDoubtById };