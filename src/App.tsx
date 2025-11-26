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
          height: 60,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          justifyContent: 'space-between',
        }}>
          {/* Hamburger Menu Button */}
          <TouchableOpacity
            onPress={() => setMenuOpen(!menuOpen)}
            style={{
              padding: 8,
            }}
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
            fontSize: 16,
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
              top: 60,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />
        )}

        {/* Slide-out Navigation Menu */}
        {menuOpen && (
          <View style={{
            position: 'absolute',
            top: 60,
            left: 0,
            bottom: 0,
            width: 280,
            backgroundColor: colors.card,
            borderRightWidth: 1,
            borderRightColor: colors.border,
            zIndex: 1000,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {tabs.map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => handleTabChange(tab)}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    backgroundColor: activeTab === tab ? colors.primary : 'transparent',
                    borderLeftWidth: activeTab === tab ? 4 : 0,
                    borderLeftColor: colors.primary,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    color: activeTab === tab ? colors.background : colors.foreground,
                    fontWeight: activeTab === tab ? 'bold' : 'normal',
                  }}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Content Area */}
        <View style={{ flex: 1 }}>
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
