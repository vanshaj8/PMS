import api from './api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  pipId?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export const notificationService = {
  async getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    const response = await api.get<{ notifications: Notification[] }>(
      `/notifications?unreadOnly=${unreadOnly}`
    );
    return response.data.notifications;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.post<{ notification: Notification }>(
      `/notifications/${notificationId}/read`
    );
    return response.data.notification;
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },
};

