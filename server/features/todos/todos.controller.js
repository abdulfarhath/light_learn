const todosService = require('./todos.service');

class TodosController {
    async getTodos(req, res) {
        try {
            const todos = await todosService.getTodosByUserId(req.user.id);
            res.json({ todos });
        } catch (error) {
            console.error('Error fetching todos:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async createTodo(req, res) {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ error: 'Text is required' });
            }
            const todo = await todosService.createTodo(req.user.id, text);
            res.status(201).json({ todo });
        } catch (error) {
            console.error('Error creating todo:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async toggleTodo(req, res) {
        try {
            const { id } = req.params;
            const todo = await todosService.toggleTodo(req.user.id, id);
            if (!todo) {
                return res.status(404).json({ error: 'Todo not found' });
            }
            res.json({ todo });
        } catch (error) {
            console.error('Error toggling todo:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async deleteTodo(req, res) {
        try {
            const { id } = req.params;
            const result = await todosService.deleteTodo(req.user.id, id);
            if (!result) {
                return res.status(404).json({ error: 'Todo not found' });
            }
            res.json({ message: 'Todo deleted successfully' });
        } catch (error) {
            console.error('Error deleting todo:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = new TodosController();
