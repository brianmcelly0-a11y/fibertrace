import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import PasswordRecoveryScreen from './screens/PasswordRecoveryScreen';
import { MapScreen } from './screens/MapScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { CustomerScreen } from './screens/CustomerScreen';
import JobsHubScreen from './screens/JobsHubScreen';
import InventoryScreen from './screens/InventoryScreen';
import ToolsHubScreen from './screens/ToolsHubScreen';
import InfrastructureHubScreen from './screens/InfrastructureHubScreen';
import ReportsHubScreen from './screens/ReportsHubScreen';
import SettingsHubScreen from './screens/SettingsHubScreen';
import AdminHubScreen from './screens/AdminHubScreen';
import { colors } from './theme/colors';
import { initializeOfflineStorage } from './lib/offlineStorage';
import { syncManager } from './services/SyncManager';
import * as AuthStorage from './lib/authStorage';
import * as Permissions from './lib/permissions';
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
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<{ isOnline: boolean; unsynced: number }>({ isOnline: true, unsynced: 0 });
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [authScreen, setAuthScreen] = React.useState<'login' | 'register' | 'recovery'>('login');
  const [showPermissionsPrompt, setShowPermissionsPrompt] = React.useState(false);

  useEffect(() => {
    initializeOfflineStorage().catch(error => {
      console.error('Failed to initialize offline storage:', error);
    });

    syncManager.initialize().catch(error => {
      console.error('Failed to initialize sync manager:', error);
    });

    const checkAuth = async () => {
      const loggedIn = await AuthStorage.isLoggedIn();
      setIsLoggedIn(loggedIn);
      setLoading(false);
    };

    checkAuth();

    const checkSync = async () => {
      try {
        const pendingCount = await syncManager.getPendingCount();
        setSyncStatus({ isOnline: syncManager.getOnlineStatus(), unsynced: pendingCount });
      } catch {
        setSyncStatus({ isOnline: false, unsynced: 0 });
      }
    };

    checkSync();
    const interval = setInterval(checkSync, 30000);

    const unsubscribe = syncManager.on('online-status-changed', (data) => {
      setSyncStatus(prev => ({ ...prev, isOnline: data.isOnline }));
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
      syncManager.shutdown();
    };
  }, []);

  const handleLoginSuccess = React.useCallback(async (user: any) => {
    try {
      const validUser: AuthStorage.User = {
        id: user.id,
        email: user.email,
        role: (user.role || 'Technician') as any,
        full_name: user.full_name,
        technicianId: user.technicianId,
      };
      await AuthStorage.saveUser(validUser);
      setIsLoggedIn(true);
      setShowPermissionsPrompt(true); // Show permissions after login
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }, []);

  const requestAppPermissions = async () => {
    try {
      const locationGranted = await Permissions.requestLocationPermission();
      if (locationGranted) {
        await Permissions.savePermissionPreference('location', true);
      }
      
      const bluetoothGranted = await Permissions.requestBluetoothPermission();
      if (bluetoothGranted) {
        await Permissions.savePermissionPreference('bluetooth', true);
      }
      
      setShowPermissionsPrompt(false);
      
      if (locationGranted && bluetoothGranted) {
        Alert.alert('✓ Permissions Granted', 'GPS and Bluetooth enabled for full functionality');
      } else {
        Alert.alert('⚠️ Limited Permissions', 'Some features may not work without GPS and Bluetooth access');
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setShowPermissionsPrompt(false);
    }
  };

  const handleLogout = async () => {
    await AuthStorage.clearUser();
    setIsLoggedIn(false);
    setActiveTab('Dashboard');
    setAuthScreen('login');
  };

  // Show permissions prompt after login
  if (showPermissionsPrompt) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 24,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: colors.primary,
        }}>
          <Text style={{ fontSize: 28, marginBottom: 16 }}>📍📶</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.foreground,
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Enable Permissions
          </Text>
          <Text style={{
            fontSize: 13,
            color: colors.mutedForeground,
            marginBottom: 16,
            textAlign: 'center',
            lineHeight: 20,
          }}>
            FiberTrace needs GPS for location tracking and Bluetooth for connecting to meters and testing equipment.
          </Text>
          <TouchableOpacity
            onPress={requestAppPermissions}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 8,
              marginBottom: 8,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.background, fontWeight: '600', fontSize: 14 }}>
              ✓ Grant Permissions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowPermissionsPrompt(false)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 32,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: '500', fontSize: 14 }}>
              Skip for Now
            </Text>
          </TouchableOpacity>
          <Text style={{
            fontSize: 11,
            color: colors.mutedForeground,
            marginTop: 12,
            textAlign: 'center',
          }}>
            You can enable these later in Settings
          </Text>
        </View>
      </View>
    );
  }

  // Show auth screens if not logged in
  if (!isLoggedIn && !loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <QueryClientProvider client={queryClient}>
          {authScreen === 'login' && (
            <LoginScreen 
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setAuthScreen('register')}
              onSwitchToRecovery={() => setAuthScreen('recovery')}
            />
          )}
          {authScreen === 'register' && (
            <RegisterScreen
              onRegisterSuccess={handleLoginSuccess}
              onSwitchToLogin={() => setAuthScreen('login')}
            />
          )}
          {authScreen === 'recovery' && (
            <PasswordRecoveryScreen
              onRecoverySuccess={() => setAuthScreen('login')}
              onSwitchToLogin={() => setAuthScreen('login')}
            />
          )}
        </QueryClientProvider>
      </View>
    );
  }

  const screens: Record<string, React.ComponentType<any>> = {
    Dashboard: DashboardScreen,
    Map: MapScreen,
    Infrastructure: InfrastructureHubScreen,
    Customers: CustomerScreen,
    Jobs: JobsHubScreen,
    Reports: ReportsHubScreen,
    Tools: ToolsHubScreen,
    Admin: AdminHubScreen,
    Settings: () => <SettingsHubScreen onLogout={handleLogout} />,
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

          {/* Sync Status & Logout */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: syncStatus.isOnline ? colors.chart.green : colors.chart.amber,
                marginRight: 4,
              }} />
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                {syncStatus.unsynced > 0 ? `${syncStatus.unsynced}⬆` : '✓'}
              </Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity onPress={handleLogout} style={{ padding: 4 }}>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>↪</Text>
            </TouchableOpacity>
          </View>

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

            {/* Logout Button at Bottom */}
            <View style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 16,
              marginTop: 'auto',
            }}>
              <TouchableOpacity
                onPress={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.destructive + '20',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.destructive,
                  letterSpacing: 0.3,
                }}>
                  🚪 Logout
                </Text>
              </TouchableOpacity>
            </View>
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
