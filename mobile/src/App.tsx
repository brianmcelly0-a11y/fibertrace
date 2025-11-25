import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MapScreen } from './screens/MapScreen';
import { JobsScreen } from './screens/JobsScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { NodeManagementScreen } from './screens/NodeManagementScreen';
import { RouteManagementScreen } from './screens/RouteManagementScreen';
import { colors } from './theme/colors';
import { initializeOfflineStorage } from './lib/offlineStorage';
import { offlineSync } from './lib/offlineSync';

const Tab = createBottomTabNavigator();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  useEffect(() => {
    // Initialize offline storage
    initializeOfflineStorage().catch(error => {
      console.error('Failed to initialize offline storage:', error);
    });

    // Start periodic sync every 5 minutes
    const cleanup = offlineSync.startPeriodic(300000);

    // Perform initial sync
    offlineSync.sync().catch(error => {
      console.error('Initial sync failed:', error);
    });

    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: true,
            tabBarStyle: {
              backgroundColor: colors.sidebar,
              borderTopColor: colors.border,
              borderTopWidth: 1,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.mutedForeground,
            headerStyle: {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            },
            headerTintColor: colors.foreground,
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              title: 'Dashboard',
              tabBarLabel: 'Dashboard',
            }}
          />
          <Tab.Screen
            name="Map"
            component={MapScreen}
            options={{
              title: 'FiberTrace Map',
              tabBarLabel: 'Map',
            }}
          />
          <Tab.Screen
            name="Nodes"
            component={NodeManagementScreen}
            options={{
              title: 'Node Management',
              tabBarLabel: 'Nodes',
            }}
          />
          <Tab.Screen
            name="Routes"
            component={RouteManagementScreen}
            options={{
              title: 'Route Management',
              tabBarLabel: 'Routes',
            }}
          />
          <Tab.Screen
            name="Jobs"
            component={JobsScreen}
            options={{
              title: 'Job Management',
              tabBarLabel: 'Jobs',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
