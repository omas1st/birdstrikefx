import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// ---- Setups ----
export const getSetups = () => API.get('/setups');
export const addSetup = (data) => API.post('/setups', data);
export const deleteSetup = (id) => API.delete(`/setups/${id}`);

// ---- Trades ----
export const recordTrade = (data) => API.post('/trades', data);
export const getTrades = (params) => API.get('/trades', { params });

// ---- Overview ----
export const getOverview = (params) => API.get('/overview', { params });

// ---- Final Analysis ----
export const getFinalAnalysis = () => API.get('/final-analysis');

// ---- Notifications ----
export const getNotifications = () => API.get('/notifications');
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllRead = () => API.put('/notifications/read-all');

export default API;