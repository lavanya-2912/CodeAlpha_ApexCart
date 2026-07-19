import api from './api.js';

export const fetchNotifications = async () => {
  return await api.get('/notifications');
};

export const markNotificationAsRead = async (id) => {
  return await api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async () => {
  return await api.put('/notifications/read-all');
};
