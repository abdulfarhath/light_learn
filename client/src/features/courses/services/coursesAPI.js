/**
 * Courses API Service
 * 
 * Handles all API calls related to courses/subjects
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const coursesAPI = {
    /**
     * Get all courses (classes) enrolled by the current student
     */
    getEnrolledCourses: async () => {
        try {
            const token = localStorage.getItem('token');
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
     * Get details of a specific course
     */
    getCourseDetails: async (classId) => {
        try {
            const token = localStorage.getItem('token');
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
     * Get subjects based on student's year, semester, branch, and college
     */
    getSubjects: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/courses/subjects`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching subjects:', error);
            throw error;
        }
    },
};

export default coursesAPI;
