import apiClient from './client';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  read: boolean;
  createdAt: string;
}

/**
 * Сервис для работы с уведомлениями
 */
export const notificationsService = {
  /**
   * Получить список уведомлений с пагинацией
   */
  async getNotifications(page = 0, size = 20): Promise<NotificationItem[]> {
    const response = await apiClient.get<NotificationItem[]>('/api/notifications', {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Получить количество непрочитанных уведомлений
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<number>('/api/notifications/unread-count');
    return response.data;
  },

  /**
   * Отметить уведомление как прочитанное
   */
  async markAsRead(notificationId: number): Promise<void> {
    await apiClient.put(`/api/notifications/${notificationId}/read`);
  },

  /**
   * Отметить все уведомления как прочитанные
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.put('/api/notifications/read-all');
  },
};
