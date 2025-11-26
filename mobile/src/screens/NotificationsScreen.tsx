import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, Switch } from 'react-native';
import { colors } from '../theme/colors';
import * as Notifications from '@/lib/pushNotifications';

const MOCK_NOTIFICATIONS: Notifications.PushNotificationPayload[] = [
  {
    id: 'n1',
    title: 'Job JOB-001 Started',
    body: 'Main Street Installation job has started. Current status: In Progress',
    category: 'job',
    priority: 'high',
    data: { jobId: 'JOB-001' },
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'n2',
    title: 'Low Stock Alert',
    body: 'SMF Cable running low: 120 units remaining (min: 100)',
    category: 'inventory',
    priority: 'normal',
    data: { itemId: 'inv1' },
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'n3',
    title: 'Job JOB-005 Completed',
    body: 'University Campus Network job completed successfully in 8.2 hours',
    category: 'job',
    priority: 'high',
    data: { jobId: 'JOB-005' },
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notifications.PushNotificationPayload[]>(MOCK_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [prefs, setPrefs] = useState<Notifications.NotificationPreferences>(Notifications.getNotificationPreferences());

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setRefreshing(false);
  };

  const handleSendTestNotification = (category: 'job' | 'inventory' | 'system') => {
    setLoading(true);
    setTimeout(() => {
      let notification: Notifications.PushNotificationPayload;
      if (category === 'job') {
        notification = Notifications.createJobAlert('JOB-TEST', 'Test Job', 'This is a test notification');
      } else if (category === 'inventory') {
        notification = Notifications.createInventoryAlert('Test Item', 25);
      } else {
        notification = Notifications.createSystemAlert('System maintenance in 1 hour');
      }
      setNotifications([notification, ...notifications]);
      Alert.alert('Success', 'Test notification sent!');
      setLoading(false);
    }, 400);
  };

  const handleTogglePreference = (key: keyof Notifications.NotificationPreferences) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    Notifications.setNotificationPreferences(newPrefs);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'job': return colors.chart.cyan;
      case 'inventory': return colors.chart.amber;
      case 'system': return colors.destructive;
      default: return colors.primary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.destructive;
      case 'normal': return colors.chart.green;
      case 'low': return colors.mutedForeground;
      default: return colors.primary;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(diff / 86400000);
    return days === 1 ? '1 day ago' : `${days}d ago`;
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <PrefRow label="Job Alerts" value={prefs.jobAlerts} onToggle={() => handleTogglePreference('jobAlerts')} />
          <PrefRow label="Inventory Alerts" value={prefs.inventoryAlerts} onToggle={() => handleTogglePreference('inventoryAlerts')} />
          <PrefRow label="System Alerts" value={prefs.systemAlerts} onToggle={() => handleTogglePreference('systemAlerts')} />
          <PrefRow label="Sound Enabled" value={prefs.soundEnabled} onToggle={() => handleTogglePreference('soundEnabled')} />
          <PrefRow label="Vibration Enabled" value={prefs.vibrationEnabled} onToggle={() => handleTogglePreference('vibrationEnabled')} />
        </View>

        {/* Test Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Test Notification</Text>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <TouchableOpacity style={styles.testButton} onPress={() => handleSendTestNotification('job')}>
                <Text style={styles.testButtonText}>Test Job Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.testButton, { backgroundColor: colors.chart.amber + '30' }]} onPress={() => handleSendTestNotification('inventory')}>
                <Text style={styles.testButtonText}>Test Inventory Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.testButton, { backgroundColor: colors.destructive + '30' }]} onPress={() => handleSendTestNotification('system')}>
                <Text style={styles.testButtonText}>Test System Alert</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Recent Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications ({notifications.length})</Text>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No notifications</Text>
            </View>
          ) : (
            notifications.map(notif => (
              <TouchableOpacity key={notif.id} style={styles.notificationCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={[styles.badge, { backgroundColor: getCategoryColor(notif.category) + '30', color: getCategoryColor(notif.category) }]}>
                    {notif.category}
                  </Text>
                </View>
                <Text style={styles.notifBody}>{notif.body}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={styles.timestamp}>{formatTime(notif.timestamp)}</Text>
                  <Text style={[styles.priority, { color: getPriorityColor(notif.priority) }]}>
                    {notif.priority.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Features</Text>
          <FeatureItem title="Real-time Alerts" description="Instant job and inventory notifications" />
          <FeatureItem title="Smart Scheduling" description="Schedule notifications for later" />
          <FeatureItem title="User Preferences" description="Customize what you receive" />
          <FeatureItem title="Priority System" description="High, normal, and low priority notifications" />
        </View>
      </ScrollView>
    </View>
  );
}

function PrefRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <View style={styles.prefRow}>
      <Text style={styles.prefLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.primary }} />
    </View>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { paddingHorizontal: 12, paddingVertical: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  prefLabel: { fontSize: 12, color: colors.foreground },
  testButton: { backgroundColor: colors.chart.cyan + '20', borderRadius: 6, paddingVertical: 12, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: colors.primary },
  testButtonText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  notificationCard: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: colors.primary },
  notifTitle: { fontSize: 12, fontWeight: '600', color: colors.foreground, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: '600' },
  notifBody: { fontSize: 11, color: colors.mutedForeground, marginVertical: 4 },
  timestamp: { fontSize: 10, color: colors.mutedForeground },
  priority: { fontSize: 10, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 12, color: colors.mutedForeground },
  featureItem: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  featureTitle: { fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  featureDesc: { fontSize: 11, color: colors.mutedForeground },
});
