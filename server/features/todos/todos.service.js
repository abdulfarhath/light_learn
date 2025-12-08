const pool = require('../../shared/config/database');

class TodosService {
    async getTodosByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    async createTodo(userId, text) {
        const result = await pool.query(
            'INSERT INTO todos (user_id, text) VALUES ($1, $2) RETURNING *',
            [userId, text]
        );
        return result.rows[0];
    }

    async toggleTodo(userId, todoId) {
        const result = await pool.query(
            'UPDATE todos SET completed = NOT completed WHERE id = $1 AND user_id = $2 RETURNING *',
            [todoId, userId]
        );
        return result.rows[0];
    }

    async deleteTodo(userId, todoId) {
        const result = await pool.query(
            'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id',
            [todoId, userId]
        );
        return result.rows[0];
    }
}

module.exports = new TodosService();
