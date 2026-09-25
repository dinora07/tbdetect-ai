import { NotificationItem } from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';

const delay = (ms: number = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<NotificationItem[]>('/notifications');
      } catch {
        // Fallback
      }
    }
    await delay(100);
    return appStorage.getNotifications().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async markAsRead(id: string): Promise<void> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.put(`/notifications/${id}/read`);
      } catch {
        // Fallback
      }
    }
    const current = appStorage.getNotifications();
    const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
    appStorage.setNotifications(updated);
    window.dispatchEvent(new CustomEvent('tbdetect_notifications_updated'));
  },

  async markAllAsRead(): Promise<void> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.put('/notifications/read-all');
      } catch {
        // Fallback
      }
    }
    const current = appStorage.getNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    appStorage.setNotifications(updated);
    window.dispatchEvent(new CustomEvent('tbdetect_notifications_updated'));
  },

  async deleteNotification(id: string): Promise<boolean> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.delete(`/notifications/${id}`);
      } catch {
        // Fallback
      }
    }
    const current = appStorage.getNotifications();
    const filtered = current.filter((n) => n.id !== id);
    appStorage.setNotifications(filtered);
    window.dispatchEvent(new CustomEvent('tbdetect_notifications_updated'));
    return filtered.length < current.length;
  },

  async clearAll(): Promise<void> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.delete('/notifications');
      } catch {
        // Fallback
      }
    }
    appStorage.setNotifications([]);
    window.dispatchEvent(new CustomEvent('tbdetect_notifications_updated'));
  },

  async emitNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): Promise<NotificationItem> {
    const newItem: NotificationItem = {
      ...item,
      id: `notif_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.post<NotificationItem>('/notifications', newItem);
      } catch {
        // Fallback
      }
    }

    const current = appStorage.getNotifications();
    appStorage.setNotifications([newItem, ...current]);
    window.dispatchEvent(new CustomEvent('tbdetect_notifications_updated'));
    return newItem;
  },
};
