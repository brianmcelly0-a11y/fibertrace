import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MapScreen } from './screens/MapScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { NodeManagementScreen } from './screens/NodeManagementScreen';
import { RouteManagementScreen } from './screens/RouteManagementScreen';
import JobListScreen from './screens/JobListScreen';
import InventoryScreen from './screens/InventoryScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import SearchScreen from './screens/SearchScreen';
import GPSTrackingScreen from './screens/GPSTrackingScreen';
import ReportsScreen from './screens/ReportsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import BluetoothScreen from './screens/BluetoothScreen';
import PerformanceScreen from './screens/PerformanceScreen';
import SettingsScreen from './screens/SettingsScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import SyncStatusScreen from './screens/SyncStatusScreen';
import { colors } from './theme/colors';
import { initializeOfflineStorage } from './lib/offlineStorage';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AppContent() {
  const [activeTab, setActiveTab] = React.useState('Dashboard');
  const [menuOpen, setMenuOpen] = React.useState(false);

  useEffect(() => {
    initializeOfflineStorage().catch(error => {
      console.error('Failed to initialize offline storage:', error);
    });
  }, []);

  const screens: Record<string, React.ComponentType<any>> = {
    Dashboard: DashboardScreen,
    Map: MapScreen,
    Nodes: NodeManagementScreen,
    Routes: RouteManagementScreen,
    Jobs: JobListScreen,
    Inventory: InventoryScreen,
    Schedule: ScheduleScreen,
    Analytics: AnalyticsScreen,
    Search: SearchScreen,
    GPS: GPSTrackingScreen,
    Reports: ReportsScreen,
    Alerts: NotificationsScreen,
    BT: BluetoothScreen,
    Perf: PerformanceScreen,
    Settings: SettingsScreen,
    Profile: UserProfileScreen,
    Sync: SyncStatusScreen,
  };

  const ActiveScreen = screens[activeTab];
  const tabs = Object.keys(screens);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <QueryClientProvider client={queryClient}>
        {/* Top Navigation Bar */}
        <View style={{
          height: 64,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          justifyContent: 'space-between',
          paddingTop: 8,
          paddingBottom: 8,
        }}>
          {/* Hamburger Menu Button */}
          <TouchableOpacity
            onPress={() => setMenuOpen(!menuOpen)}
            style={{
              padding: 12,
              marginLeft: -12,
              borderRadius: 8,
            }}
            activeOpacity={0.6}
          >
            <Text style={{ fontSize: 24, color: colors.foreground }}>☰</Text>
          </TouchableOpacity>

          {/* Current Screen Title */}
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.foreground,
            flex: 1,
            marginLeft: 16,
          }}>
            {activeTab}
          </Text>

          {/* App Title/Logo */}
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.primary,
          }}>
            FiberTrace
          </Text>
        </View>

        {/* Overlay when menu is open */}
        {menuOpen && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 998,
            }}
          />
        )}

        {/* Slide-out Navigation Drawer */}
        {menuOpen && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 280,
            backgroundColor: colors.card,
            borderRightWidth: 2,
            borderRightColor: colors.border,
            zIndex: 999,
            paddingTop: 16,
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 8,
          }}>
            {/* Drawer Header */}
            <View style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              marginBottom: 8,
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: colors.primary,
              }}>
                FiberTrace
              </Text>
              <Text style={{
                fontSize: 12,
                color: colors.mutedForeground,
                marginTop: 4,
              }}>
                Fiber Network Management
              </Text>
            </View>

            {/* Navigation Items */}
            <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={true}>
              {tabs.map((tab, index) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => handleTabChange(tab)}
                  activeOpacity={0.6}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    backgroundColor: activeTab === tab ? colors.primary + '20' : 'transparent',
                    borderLeftWidth: activeTab === tab ? 4 : 0,
                    borderLeftColor: colors.primary,
                    marginVertical: 2,
                  }}
                >
                  <Text style={{
                    fontSize: 15,
                    color: activeTab === tab ? colors.primary : colors.foreground,
                    fontWeight: activeTab === tab ? '600' : '500',
                    letterSpacing: 0.2,
                  }}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Content Area - Takes Full Space When Menu Closed */}
        <View style={{ flex: 1, overflow: 'hidden' }}>
          {ActiveScreen && <ActiveScreen />}
        </View>
      </QueryClientProvider>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
