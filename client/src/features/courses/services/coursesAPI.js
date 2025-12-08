import api from '../../../shared/utils/api';

const coursesAPI = {
    /**
     * Get subjects for the current user
     */
    getSubjects: async () => {
        const response = await api.get('/courses/subjects');
        return response.data;
    }
};

export default coursesAPI;