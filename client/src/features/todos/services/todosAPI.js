import api from '../../../shared/utils/api';

const todosAPI = {
    getTodos: async () => {
        const response = await api.get('/todos');
        return response.data;
    },

    addTodo: async (text) => {
        const response = await api.post('/todos', { text });
        return response.data;
    },

    toggleTodo: async (id) => {
        const response = await api.put(`/todos/${id}/toggle`);
        return response.data;
    },

    deleteTodo: async (id) => {
        const response = await api.delete(`/todos/${id}`);
        return response.data;
    }
};

export default todosAPI;
