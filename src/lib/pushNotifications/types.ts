export interface PushNotificationPayload {
  id: string;
  title: string;
  body: string;
  category: 'job' | 'inventory' | 'alert' | 'system';
  priority: 'low' | 'normal' | 'high';
  data: Record<string, any>;
  timestamp: string;
}

export interface NotificationHandler {
  onReceived: (notification: PushNotificationPayload) => void;
  onPressed: (notification: PushNotificationPayload) => void;
}

export interface NotificationSchedule {
  id: string;
  title: string;
  body: string;
  triggerSeconds: number;
  recurring: boolean;
}

export interface NotificationPreferences {
  jobAlerts: boolean;
  inventoryAlerts: boolean;
  systemAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}
