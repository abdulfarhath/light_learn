import axios from 'axios';

// Create axios instance with base configuration
const API_URL = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token expired or invalid - clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Authentication API endpoints
export const authAPI = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

// User API endpoints
export const userAPI = {
    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    getTeachers: async () => {
        const response = await api.get('/users/teachers');
        return response.data;
    },

    getStudents: async () => {
        const response = await api.get('/users/students');
        return response.data;
    },
};

// Class API endpoints
export const classAPI = {
    createClass: async (className) => {
        const response = await api.post('/classes/create', { class_name: className });
        return response.data;
    },

    joinClass: async (classCode) => {
        const response = await api.post('/classes/join', { class_code: classCode });
        return response.data;
    },

    getMyClasses: async (role) => {
        const endpoint = role === 'teacher' ? '/classes/my-classes' : '/classes/enrolled';
        const response = await api.get(endpoint);
        return response.data;
    },

    getClassDetails: async (classId) => {
        const response = await api.get(`/classes/${classId}`);
        return response.data;
    },

    getClassStudents: async (classId) => {
        const response = await api.get(`/classes/${classId}/students`);
        return response.data;
    },
};

// Health check
export const healthAPI = {
    check: async () => {
        const response = await api.get('/health');
        return response.data;
    },
};

export default api;
