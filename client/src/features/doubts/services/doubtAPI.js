import api from '../../../services/api'; // Your Axios instance

export const fetchDoubts = async () => {
    console.log('🔄 fetchDoubts: Calling /doubts endpoint');
    const response = await api.get('/doubts');
    console.log('📥 fetchDoubts: Raw response:', response.data);
    // Handle both array and object responses
    const result = Array.isArray(response.data) ? response.data : (response.data.doubts || []);
    console.log('✅ fetchDoubts: Returning', result.length, 'doubts');
    return result;
};

export const createDoubt = async (doubtData) => {
    const response = await api.post('/doubts', doubtData);
    return response.data;
};

export const postAnswer = async (doubtId, content) => {
    const response = await api.post(`/doubts/${doubtId}/answers`, { content });
    return response.data;
};

export const updateDoubtStatus = async (doubtId, status) => {
    const response = await api.patch(`/doubts/${doubtId}/status`, { status });
    return response.data;
};