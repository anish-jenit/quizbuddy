import axios from 'axios';

// In production the React app is served by the API server, so a relative URL
// keeps requests on the same host. Local Vite development proxies /api.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  guestLogin: (data) => api.post('/auth/guest', data),
  resetTeacherPassword: (data) => api.post('/auth/reset-teacher-password', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Quiz APIs
export const quizAPI = {
  createQuiz: (data) => api.post('/quizzes', data),
  getQuizzes: (params) => api.get('/quizzes', { params }),
  getQuizById: (id) => api.get(`/quizzes/${id}`),
  updateQuiz: (id, data) => api.put(`/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}`),
  publishQuiz: (id) => api.put(`/quizzes/${id}/publish`),
  reactToQuiz: (id, data) => api.put(`/quizzes/${id}/reaction`, data),
  reportQuiz: (id, data) => api.post(`/quizzes/${id}/report`, data),
};

// Question APIs
export const questionAPI = {
  addQuestion: (quizId, data) => api.post(`/questions/${quizId}/questions`, data),
  getQuestions: (quizId) => api.get(`/questions/${quizId}/questions`),
  updateQuestion: (id, data) => api.put(`/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
  reportQuestion: (id, data) => api.post(`/questions/${id}/report`, data),
};

// Response APIs
export const responseAPI = {
  startQuiz: (data) => api.post('/responses/start', data),
  submitAnswer: (data) => api.post('/responses/submit-answer', data),
  completeQuiz: (responseId) => api.put(`/responses/${responseId}/complete`),
  getHistory: (quizId) => api.get(`/responses/history/${quizId}`),
  getLeaderboard: (params) => api.get('/responses/leaderboard', { params }),
};

// Group APIs
export const groupAPI = {
  createGroup: (data) => api.post('/groups', data),
  getGroupById: (id) => api.get(`/groups/${id}`),
  joinGroup: (data) => api.post('/groups/join', data),
  getMyGroups: () => api.get('/groups'),
  addMentor: (data) => api.post('/groups/mentor/add', data),
  removeMentor: (data) => api.post('/groups/mentor/remove', data),
  leaveGroup: (data) => api.post('/groups/leave', data),
  getPendingMentors: (groupId) => api.get(`/groups/${groupId}/pending-mentors`),
  reviewMentorRequest: (groupId, data) => api.put(`/groups/${groupId}/review-mentor`, data),
  addStudentByEmail: (groupId, data) => api.post(`/groups/${groupId}/add-student`, data),
  removeStudent: (groupId, data) => api.post(`/groups/${groupId}/remove-student`, data),
  updateVisibility: (groupId, visibility) => api.put(`/groups/${groupId}/visibility`, { visibility }),
};

// Admin APIs
export const adminAPI = {
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (data) => api.put('/admin/users/role', data),
  getPendingTeacherRequests: () => api.get('/admin/teachers/pending'),
  getReviewedTeacherRequests: () => api.get('/admin/teachers/reviewed'),
  reviewTeacherRequest: (data) => api.put('/admin/teachers/review', data),
  getReportedQuestions: () => api.get('/admin/questions/reported'),
  resolveReport: (data) => api.put('/admin/questions/report/resolve', data),
  getReportedQuizzes: () => api.get('/admin/quizzes/reported'),
  reviewQuizReport: (data) => api.put('/admin/quizzes/report/review', data),
  importPublicQuizzes: (csv) => api.post('/admin/quizzes/import', { csv }),
  downloadQuizImportTemplate: () => api.get('/admin/quizzes/import-template', { responseType: 'blob' }),
  getDashboardStats: () => api.get('/admin/stats'),
  getPendingMentorRemovals: () => api.get('/admin/mentor-removals/pending'),
  reviewMentorRemoval: (data) => api.put('/admin/mentor-removals/review', data),
};
