import { PushNotificationPayload, NotificationHandler, NotificationSchedule, NotificationPreferences } from './types';

const defaultPreferences: NotificationPreferences = {
  jobAlerts: true,
  inventoryAlerts: true,
  systemAlerts: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

let handlers: NotificationHandler | null = null;
let preferences = { ...defaultPreferences };
let scheduledNotifications: NotificationSchedule[] = [];

export function registerNotificationHandlers(newHandlers: NotificationHandler): void {
  handlers = newHandlers;
}

export function sendNotification(payload: PushNotificationPayload): void {
  const shouldSend = shouldSendNotification(payload.category);
  if (!shouldSend) return;

  if (handlers?.onReceived) {
    handlers.onReceived(payload);
  }
}

export function handleNotificationPress(payload: PushNotificationPayload): void {
  if (handlers?.onPressed) {
    handlers.onPressed(payload);
  }
}

export function scheduleNotification(schedule: NotificationSchedule): string {
  const id = `sched-${Date.now()}`;
  const newSchedule = { ...schedule, id };
  scheduledNotifications.push(newSchedule);

  if (typeof setTimeout !== 'undefined') {
    setTimeout(() => {
      const notification: PushNotificationPayload = {
        id,
        title: schedule.title,
        body: schedule.body,
        category: 'system',
        priority: 'normal',
        data: {},
        timestamp: new Date().toISOString(),
      };
      sendNotification(notification);

      if (schedule.recurring) {
        scheduleNotification(schedule);
      } else {
        scheduledNotifications = scheduledNotifications.filter(n => n.id !== id);
      }
    }, schedule.triggerSeconds * 1000);
  }

  return id;
}

export function cancelScheduledNotification(id: string): void {
  scheduledNotifications = scheduledNotifications.filter(n => n.id !== id);
}

export function setNotificationPreferences(newPreferences: Partial<NotificationPreferences>): void {
  preferences = { ...preferences, ...newPreferences };
}

export function getNotificationPreferences(): NotificationPreferences {
  return { ...preferences };
}

export function createJobAlert(jobId: string, jobName: string, message: string): PushNotificationPayload {
  return {
    id: `job-${jobId}-${Date.now()}`,
    title: `Job Update: ${jobName}`,
    body: message,
    category: 'job',
    priority: 'high',
    data: { jobId, type: 'job_update' },
    timestamp: new Date().toISOString(),
  };
}

export function createInventoryAlert(itemName: string, quantity: number): PushNotificationPayload {
  return {
    id: `inv-${Date.now()}`,
    title: 'Low Stock Alert',
    body: `${itemName} is running low (${quantity} remaining)`,
    category: 'inventory',
    priority: 'normal',
    data: { type: 'inventory_low' },
    timestamp: new Date().toISOString(),
  };
}

export function createSystemAlert(message: string): PushNotificationPayload {
  return {
    id: `sys-${Date.now()}`,
    title: 'System Alert',
    body: message,
    category: 'system',
    priority: 'high',
    data: { type: 'system_alert' },
    timestamp: new Date().toISOString(),
  };
}

function shouldSendNotification(category: string): boolean {
  switch (category) {
    case 'job':
      return preferences.jobAlerts;
    case 'inventory':
      return preferences.inventoryAlerts;
    case 'system':
      return preferences.systemAlerts;
    default:
      return true;
  }
}
