import { v4 as uuidv4 } from 'uuid';
import { db } from '../utils/database.js';

export interface Notification {
  id: string;
  userId: string;
  type: 'pip_created' | 'pip_approved' | 'pip_rejected' | 'step_due' | 'step_overdue' | 'pip_acknowledged' | 'pip_completed' | 'timeline_changed' | 'manager_reassigned';
  title: string;
  message: string;
  pipId?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export class NotificationService {
  async createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> {
    const notif: Notification = {
      id: uuidv4(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await db.create('notifications', notif);
    return notif;
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    let notifications = await db.find<Notification>('notifications', n => n.userId === userId);
    
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    return notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    return await db.update<Notification>('notifications', notificationId, {
      read: true,
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await db.find<Notification>('notifications', n => 
      n.userId === userId && !n.read
    );

    for (const notif of notifications) {
      await db.update<Notification>('notifications', notif.id, { read: true });
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await db.find<Notification>('notifications', n => 
      n.userId === userId && !n.read
    );
    return notifications.length;
  }

  // Notification creation helpers
  async notifyPIPCreated(pipId: string, employeeId: string, managerId: string, hrbpId: string): Promise<void> {
    // Notify HRBP
    await this.createNotification({
      userId: hrbpId,
      type: 'pip_created',
      title: 'New PIP Created',
      message: 'A new Performance Improvement Plan requires your review',
      pipId,
      actionUrl: `/pips/${pipId}`,
    });
  }

  async notifyStepDue(pipId: string, userId: string, stepName: string, dueDate: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'step_due',
      title: `PIP Step Due Soon: ${stepName.replace(/_/g, ' ')}`,
      message: `The step "${stepName.replace(/_/g, ' ')}" is due on ${new Date(dueDate).toLocaleDateString()}`,
      pipId,
      actionUrl: `/pips/${pipId}`,
    });
  }

  async notifyStepOverdue(pipId: string, userId: string, stepName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'step_overdue',
      title: `PIP Step Overdue: ${stepName.replace(/_/g, ' ')}`,
      message: `The step "${stepName.replace(/_/g, ' ')}" is now overdue. Please take action.`,
      pipId,
      actionUrl: `/pips/${pipId}`,
    });
  }

  async notifyPIPAcknowledged(pipId: string, managerId: string): Promise<void> {
    await this.createNotification({
      userId: managerId,
      type: 'pip_acknowledged',
      title: 'PIP Acknowledged',
      message: 'The employee has acknowledged the Performance Improvement Plan',
      pipId,
      actionUrl: `/pips/${pipId}`,
    });
  }

  async notifyPIPCompleted(pipId: string, employeeId: string, managerId: string, hrbpId: string, outcome: string): Promise<void> {
    const message = `PIP has been completed with outcome: ${outcome}`;
    
    await this.createNotification({
      userId: employeeId,
      type: 'pip_completed',
      title: 'PIP Completed',
      message,
      pipId,
      actionUrl: `/pips/${pipId}`,
    });

    await this.createNotification({
      userId: managerId,
      type: 'pip_completed',
      title: 'PIP Completed',
      message,
      pipId,
      actionUrl: `/pips/${pipId}`,
    });

    await this.createNotification({
      userId: hrbpId,
      type: 'pip_completed',
      title: 'PIP Completed',
      message,
      pipId,
      actionUrl: `/pips/${pipId}`,
    });
  }
}

export const notificationService = new NotificationService();

