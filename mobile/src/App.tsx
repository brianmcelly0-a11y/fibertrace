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
  };

  const ActiveScreen = screens[activeTab];

  const tabs = Object.keys(screens);
  const tabsPerPage = 5;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <QueryClientProvider client={queryClient}>
        {ActiveScreen && <ActiveScreen />}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                alignItems: 'center',
                backgroundColor: activeTab === tab ? colors.primary : 'transparent',
                borderBottomWidth: activeTab === tab ? 3 : 0,
                borderBottomColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: 11, color: activeTab === tab ? colors.background : colors.mutedForeground, fontWeight: '600' }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
