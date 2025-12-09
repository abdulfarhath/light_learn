import api from '../../../shared/utils/api';

export const teacherCoursesAPI = {
    /**
     * Create a new course
     */
    createCourse: async (courseData) => {
        const response = await api.post('/teacher-courses', courseData);
        return response.data;
    },

    /**
     * Get all courses by teacher
     */
    getMyCourses: async () => {
        const response = await api.get('/teacher-courses');
        return response.data;
    },

    /**
     * Get course by ID
     */
    getCourseById: async (courseId) => {
        const response = await api.get(`/teacher-courses/${courseId}`);
        return response.data;
    },

    /**
     * Update course
     */
    updateCourse: async (courseId, courseData) => {
        const response = await api.put(`/teacher-courses/${courseId}`, courseData);
        return response.data;
    },

    /**
     * Add topic to course
     */
    addTopic: async (courseId, topicData) => {
        const response = await api.post(`/teacher-courses/${courseId}/topics`, topicData);
        return response.data;
    },

    /**
     * Add material to topic
     */
    addMaterial: async (topicId, materialData) => {
        const response = await api.post(`/teacher-courses/topics/${topicId}/materials`, materialData);
        return response.data;
    },

    /**
     * Upload file
     */
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/teacher-courses/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    /**
     * Delete course
     */
    deleteCourse: async (courseId) => {
        const response = await api.delete(`/teacher-courses/${courseId}`);
        return response.data;
    }
};

export default teacherCoursesAPI;
