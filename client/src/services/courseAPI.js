import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get(`${API_URL}/classes/enrolled`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching enrolled courses:', error);
            throw error;
        }
    },

    /**
     * Get details of a specific course by ID
     * @param {number} classId - The ID of the class/course
     * @returns {Promise} Promise with course details
     */
    getCourseDetails: async (classId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get(`${API_URL}/classes/${classId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching course details:', error);
            throw error;
        }
    },

    /**
     * Get all available courses (for browsing/joining)
     * @returns {Promise} Promise with available courses data
     */
    getAllCourses: async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get(`${API_URL}/classes`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching all courses:', error);
            throw error;
        }
    },

    /**
     * Enroll in a course using class code
     * @param {string} classCode - The code of the class to join
     * @returns {Promise} Promise with enrollment result
     */
    enrollInCourse: async (classCode) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post(
                `${API_URL}/classes/join`,
                { class_code: classCode },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error enrolling in course:', error);
            throw error;
        }
    },
};

export default courseAPI;
