import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { authService } from '../services/AuthService';
import { AdminDashboardScreen } from './admin/AdminDashboardScreen';
import { AdminInventoryScreen } from './admin/AdminInventoryScreen';
import { AdminUsersScreen } from './admin/AdminUsersScreen';
import { AdminJobsScreen } from './admin/AdminJobsScreen';
import { AdminSettingsScreen } from './admin/AdminSettingsScreen';

type AdminTab = 'dashboard' | 'inventory' | 'users' | 'jobs' | 'settings';

interface TabConfig {
  key: AdminTab;
  label: string;
  icon: string;
}

export default function AdminHubScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      await authService.initialize();
      setIsAdmin(authService.isAdmin() || authService.isManager());
    };
    checkAdmin();
  }, []);

  const tabs: TabConfig[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'jobs', label: 'Jobs', icon: '📋' },
    { key: 'inventory', label: 'Inventory', icon: '📦' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleNavigate = (screen: string) => {
    const screenMap: Record<string, AdminTab> = {
      'inventory': 'inventory',
      'users': 'users',
      'jobs': 'jobs',
      'settings': 'settings',
      'dashboard': 'dashboard',
    };
    if (screenMap[screen]) {
      setActiveTab(screenMap[screen]);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedIcon}>🔒</Text>
        <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
        <Text style={styles.accessDeniedText}>
          This area is only available for Administrators and Managers.
        </Text>
      </View>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardScreen onNavigate={handleNavigate} />;
      case 'inventory':
        return <AdminInventoryScreen />;
      case 'users':
        return <AdminUsersScreen />;
      case 'jobs':
        return <AdminJobsScreen />;
      case 'settings':
        return <AdminSettingsScreen />;
      default:
        return <AdminDashboardScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
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
      </ScrollView>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 56,
  },
  tabBarContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary + '20',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  accessDenied: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
  },
});
