import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { colors } from '../theme/colors';
import * as Notifications from '@/lib/pushNotifications';
import * as AuthStorage from '../lib/authStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TabType = 'settings' | 'profile' | 'notifications';

interface SettingsHubProps {
  onLogout?: () => void;
}

export default function SettingsHubScreen({ onLogout }: SettingsHubProps) {
  const [activeTab, setActiveTab] = useState<TabType>('settings');

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'settings', label: 'Settings', icon: '⚙️' },
    { key: 'profile', label: 'Profile', icon: '👤' },
    { key: 'notifications', label: 'Alerts', icon: '🔔' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'profile' && <ProfileTab onLogout={onLogout} />}
        {activeTab === 'notifications' && <NotificationsTab />}
      </View>
    </View>
  );
}

function SettingsTab() {
  const [darkMode, setDarkMode] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [gpsAlways, setGpsAlways] = useState(false);
  const [dataLimit, setDataLimit] = useState(false);

  const handleToggle = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try {
      await AsyncStorage.setItem(`setting_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(k => k.startsWith('cache_'));
              await AsyncStorage.multiRemove(cacheKeys);
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleFactoryReset = () => {
    Alert.alert(
      'Factory Reset',
      'This will clear ALL local data including saved settings, cached data, and user preferences. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Reset Complete', 'App has been reset to factory settings');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <SettingRow label="Dark Mode" value={darkMode} onToggle={v => handleToggle('darkMode', v, setDarkMode)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Sync</Text>
        <SettingRow label="Auto Sync" value={autoSync} onToggle={v => handleToggle('autoSync', v, setAutoSync)} />
        <SettingRow label="Always-On GPS" value={gpsAlways} onToggle={v => handleToggle('gpsAlways', v, setGpsAlways)} />
        <SettingRow label="Data Saver Mode" value={dataLimit} onToggle={v => handleToggle('dataLimit', v, setDataLimit)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <InfoRow label="App Version" value="1.0.0" />
        <InfoRow label="Build Number" value="2025.11.28" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
          <Text style={styles.actionButtonText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleFactoryReset}>
          <Text style={styles.dangerButtonText}>Factory Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>FiberTrace</Text>
          <Text style={styles.aboutVersion}>v1.0.0</Text>
          <Text style={styles.aboutDesc}>Professional fiber optic technician management system</Text>
          <Text style={styles.aboutCopy}>© 2025 FiberTrace. All rights reserved.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ProfileTab({ onLogout }: { onLogout?: () => void }) {
  const [user, setUser] = useState({
    id: 'unknown',
    name: 'Technician',
    email: 'user@fibertrace.app',
    role: 'Technician',
  });

  React.useEffect(() => {
    const loadUser = async () => {
      const savedUser = await AuthStorage.getStoredUser();
      if (savedUser) {
        setUser({
          id: savedUser.id?.toString() || 'unknown',
          name: savedUser.full_name || 'Technician',
          email: savedUser.email,
          role: savedUser.role || 'Technician',
        });
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AuthStorage.clearUser();
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.split(' ').map((n: string) => n[0]).join('')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Role" value={user.role} />
        <InfoRow label="ID" value={user.id} />
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.profileActionButton} onPress={handleLogout}>
          <Text style={[styles.profileActionButtonText, { color: colors.destructive }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    jobAlerts: true,
    inventoryAlerts: true,
    systemAlerts: true,
  });

  const handleTogglePreference = async (key: string) => {
    const newPrefs = { ...prefs, [key]: !prefs[key as keyof typeof prefs] };
    setPrefs(newPrefs);
    try {
      await AsyncStorage.setItem('notification_prefs', JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  };

  return (
    <ScrollView>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Preferences</Text>
        <SettingRow label="Job Alerts" value={prefs.jobAlerts} onToggle={() => handleTogglePreference('jobAlerts')} />
        <SettingRow label="Inventory Alerts" value={prefs.inventoryAlerts} onToggle={() => handleTogglePreference('inventoryAlerts')} />
        <SettingRow label="System Alerts" value={prefs.systemAlerts} onToggle={() => handleTogglePreference('systemAlerts')} />
      </View>
    </ScrollView>
  );
}

function SettingRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.card, true: colors.primary }} />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabContainer: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabIcon: { fontSize: 18, marginBottom: 4 },
  tabLabel: { fontSize: 12, color: colors.mutedForeground },
  tabLabelActive: { color: colors.primary, fontWeight: '600' },
  content: { flex: 1 },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  settingLabel: { fontSize: 14, color: colors.foreground },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 13, color: colors.mutedForeground },
  infoValue: { fontSize: 13, color: colors.foreground, fontWeight: '500' },
  profileHeader: { flexDirection: 'row', padding: 16, backgroundColor: colors.card, alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.background },
  userName: { fontSize: 16, fontWeight: '600', color: colors.foreground },
  userRole: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  userEmail: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  actionButton: { padding: 12, backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: colors.background, fontWeight: '600' },
  dangerButton: { padding: 12, backgroundColor: colors.destructive + '20', borderRadius: 8, alignItems: 'center' },
  dangerButtonText: { color: colors.destructive, fontWeight: '600' },
  profileActionButton: { padding: 12, backgroundColor: colors.card, borderRadius: 8, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  profileActionButtonText: { fontWeight: '600' },
  aboutCard: { backgroundColor: colors.card, padding: 16, borderRadius: 8, alignItems: 'center' },
  aboutTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  aboutVersion: { fontSize: 12, color: colors.mutedForeground, marginBottom: 8 },
  aboutDesc: { fontSize: 12, color: colors.foreground, textAlign: 'center', marginBottom: 4 },
  aboutCopy: { fontSize: 11, color: colors.mutedForeground },
});
