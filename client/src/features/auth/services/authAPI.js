import api from '../../../shared/utils/api';

/**
 * Auth API Service
 * Handles all authentication-related API calls
 */
export const authAPI = {
    /**
     * Register a new user
     */
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    /**
     * Login user
     */
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    /**
     * Get current user profile from auth endpoint
     */
    getProfile: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

export default authAPI;
