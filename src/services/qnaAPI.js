import api from './api';

// Q&A API service for student and teacher interactions
export const qnaAPI = {
  // Student APIs
  
  // Get messages for a specific level
  getLevelMessages: async (level, params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...params
    });
    
    return api.get(`/qna/level/${level}?${queryParams}`);
  },

  // Send a student message
  sendStudentMessage: async (messageData) => {
    return api.post('/qna/send', messageData);
  },

  // Delete a message (student can only delete their own)
  deleteMessage: async (messageId, deleteData) => {
    return api.delete(`/qna/messages/${messageId}`, { data: deleteData });
  },

  // Teacher APIs

  // Get teacher dashboard with level summaries
  getTeacherDashboard: async (teacherId, params = {}) => {
    const queryParams = new URLSearchParams({
      level: params.level || '',
      page: params.page || 1,
      limit: params.limit || 20,
      ...params
    });
    
    return api.get(`/api/qna/teacher/dashboard/${teacherId}?${queryParams}`);
  },

  // Get messages for a specific level (teacher view)
  getTeacherLevelMessages: async (level, params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...params
    });
    
    return api.get(`/qna/level/${level}?${queryParams}`);
  },

  // Send a teacher message
  sendTeacherMessage: async (messageData) => {
    return api.post('/qna/send-teacher', messageData);
  }
};

export default qnaAPI;
