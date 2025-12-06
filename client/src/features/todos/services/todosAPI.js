import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const todosAPI = {
    getTodos: async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/todos`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    addTodo: async (text) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/todos`, { text }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    toggleTodo: async (id) => {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/todos/${id}/toggle`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    deleteTodo: async (id) => {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${API_URL}/todos/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default todosAPI;
