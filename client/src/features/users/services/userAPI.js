import api from '../../../shared/utils/api';

/**
 * User API Service
 * Handles all user-related API calls
 */
export const userAPI = {
    /**
     * Get current user profile
     */
    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    /**
     * Get all teachers (teacher only)
     */
    getTeachers: async () => {
        const response = await api.get('/users/teachers');
        return response.data;
    },

    /**
     * Get all students (teacher only)
     */
    getStudents: async () => {
        const response = await api.get('/users/students');
        return response.data;
    },
};

export default userAPI;
