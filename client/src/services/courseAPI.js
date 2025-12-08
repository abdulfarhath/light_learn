import api from '../shared/utils/api';

/**
 * Course API Service
 * Handles all API calls related to courses and subjects
 */
const courseAPI = {
    /**
     * Get all courses (classes) enrolled by the current student
     * @returns {Promise} Promise with courses data
     */
    getEnrolledCourses: async () => {
        try {
            const response = await api.get('/classes/enrolled');
            return response.data;
        } catch (error) {
            console.error('Error fetching enrolled courses:', error);
            throw error;
        }
    },

    /**
     * Get details of a specific course
     * @param {string} classId - The ID of the class
     * @returns {Promise} Promise with course details
     */
    getCourseDetails: async (classId) => {
        try {
            const response = await api.get(`/classes/${classId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching course details:', error);
            throw error;
        }
    },

    /**
     * Get subjects based on student's year, semester, branch, and college
     * @returns {Promise} Promise with subjects data
     */
    getSubjects: async () => {
        try {
            const response = await api.get('/courses/subjects');
            return response.data;
        } catch (error) {
            console.error('Error fetching subjects:', error);
            throw error;
        }
    },
};

export default courseAPI;
