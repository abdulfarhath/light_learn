import api from '../../../shared/utils/api';

export const classAPI = {
    // Create new class (teacher only)
    createClass: async (className) => {
        const response = await api.post('/classes/create', { class_name: className });
        return response.data;
    },

    // Join class with code (student only)
    joinClass: async (classCode) => {
        const response = await api.post('/classes/join', { class_code: classCode });
        return response.data;
    },

    // Get my classes (role-aware: teacher's created classes or student's enrolled classes)
    getMyClasses: async (role) => {
        const endpoint = role === 'teacher' ? '/classes/my-classes' : '/classes/enrolled';
        const response = await api.get(endpoint);
        return response.data.classes;
    },

    // Get class details
    getClassDetails: async (classId) => {
        const response = await api.get(`/classes/${classId}`);
        return response.data;
    },

    // Get students in a class (teacher only)
    getClassStudents: async (classId) => {
        const response = await api.get(`/classes/${classId}/students`);
        return response.data;
    },
};

export default classAPI;
