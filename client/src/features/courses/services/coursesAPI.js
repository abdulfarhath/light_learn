/**
 * Courses API Service
 * 
 * Handles all API calls related to courses/subjects
 */

import api from '../../../shared/utils/api';

const coursesAPI = {
    /**
     * Get all courses (classes) enrolled by the current student
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

    /**
     * Create a new subject (Teacher only)
     */
    createSubject: async (subjectData) => {
        try {
            const response = await api.post('/courses/create', subjectData);
            return response.data;
        } catch (error) {
            console.error('Error creating subject:', error);
            throw error;
        }
    },

    /**
     * Get subject by ID
     */
    getSubjectById: async (subjectId) => {
        try {
            const response = await api.get(`/courses/subjects/${subjectId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching subject:', error);
            throw error;
        }
    },

    /**
     * Update subject (Teacher only)
     */
    updateSubject: async (subjectId, updates) => {
        try {
            const response = await api.put(`/courses/subjects/${subjectId}`, updates);
            return response.data;
        } catch (error) {
            console.error('Error updating subject:', error);
            throw error;
        }
    },

    /**
     * Delete subject (Teacher only)
     */
    deleteSubject: async (subjectId) => {
        try {
            const response = await api.delete(`/courses/subjects/${subjectId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting subject:', error);
            throw error;
        }
    },
};

export default coursesAPI;
