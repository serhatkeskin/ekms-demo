import axios from 'services/axiosInstance';
import { Notification, NotificationParams } from 'types';

const API_PREFIX = '/notifications';

interface NotificationsResponse {
  results?: Notification[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

const notificationApi = {
  getNotifications: async (params: NotificationParams = {}): Promise<NotificationsResponse> => {
    try {
      const response = await axios.get(`${API_PREFIX}/`, { params });
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error('Error fetching notifications:', error);
      throw new Error(err.response?.data?.detail || 'Failed to fetch notifications');
    }
  },

  markNotificationRead: async (notificationId: number): Promise<Notification> => {
    try {
      const response = await axios.post(`${API_PREFIX}/${notificationId}/read/`, {});
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error('Error marking notification as read:', error);
      throw new Error(err.response?.data?.detail || 'Failed to update notification');
    }
  },

  markAllRead: async (): Promise<{ message?: string }> => {
    try {
      const response = await axios.post(`${API_PREFIX}/mark_all_read/`, {});
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error('Error marking all notifications as read:', error);
      throw new Error(err.response?.data?.detail || 'Failed to update notifications');
    }
  },

  deleteNotification: async (notificationId: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_PREFIX}/${notificationId}/`);
      return true;
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error('Error deleting notification:', error);
      throw new Error(err.response?.data?.detail || 'Failed to delete notification');
    }
  }
};

export default notificationApi;
