// FILE: src/api/index.js

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const eventTypesAPI = {
  getAll: () => api.get('/event-types'),
  getOne: (id) => api.get(`/event-types/${id}`),
  create: (data) => api.post('/event-types', data),
  update: (id, data) => api.put(`/event-types/${id}`, data),
  toggle: (id) => api.patch(`/event-types/${id}/toggle`),
  delete: (id) => api.delete(`/event-types/${id}`),
  // Custom questions
  getQuestions: (id) => api.get(`/event-types/${id}/questions`),
  addQuestion: (id, data) => api.post(`/event-types/${id}/questions`, data),
  updateQuestion: (id, questionId, data) => api.put(`/event-types/${id}/questions/${questionId}`, data),
  deleteQuestion: (id, questionId) => api.delete(`/event-types/${id}/questions/${questionId}`),
};

export const availabilityAPI = {
  getAll: () => api.get('/availability'),
  getOne: (id) => api.get(`/availability/${id}`),
  create: (data) => api.post('/availability', data),
  update: (id, data) => api.put(`/availability/${id}`, data),
  addOverride: (id, data) => api.post(`/availability/${id}/overrides`, data),
  deleteOverride: (id, overrideId) => api.delete(`/availability/${id}/overrides/${overrideId}`),
};

export const bookingsAPI = {
  getAll: (status) => api.get(`/bookings${status ? `?status=${status}` : ''}`),
  getOne: (id) => api.get(`/bookings/${id}`),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { cancellation_reason: reason }),
  reschedule: (id, data) => api.patch(`/bookings/${id}/reschedule`, data),
};

export const publicAPI = {
  getEventType: (username, slug) => api.get(`/public/${username}/${slug}`),
  getSlots: (username, slug, date) => api.get(`/public/${username}/${slug}/slots?date=${date}`),
  book: (username, slug, data) => api.post(`/public/${username}/${slug}/book`, data),
};

export default api;