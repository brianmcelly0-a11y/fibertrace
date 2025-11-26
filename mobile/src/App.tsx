import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MapScreen } from './screens/MapScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { NodeManagementScreen } from './screens/NodeManagementScreen';
import { RouteManagementScreen } from './screens/RouteManagementScreen';
import JobListScreen from './screens/JobListScreen';
import InventoryScreen from './screens/InventoryScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
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
  };

  const ActiveScreen = screens[activeTab];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <QueryClientProvider client={queryClient}>
        {ActiveScreen && <ActiveScreen />}
        <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
          {Object.keys(screens).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                backgroundColor: activeTab === tab ? colors.primary : 'transparent',
              }}
            >
              <Text style={{ fontSize: 12, color: activeTab === tab ? colors.background : colors.mutedForeground, fontWeight: '600' }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
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
