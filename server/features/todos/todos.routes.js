const express = require('express');
const router = express.Router();
const todosController = require('./todos.controller');
const { authenticateToken } = require('../../middleware/auth');

router.use(authenticateToken);

router.get('/', todosController.getTodos);
router.post('/', todosController.createTodo);
router.put('/:id/toggle', todosController.toggleTodo);
router.delete('/:id', todosController.deleteTodo);

module.exports = router;
