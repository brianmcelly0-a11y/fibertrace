import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MapModule from '../lib/mapModule';

export function SettingsScreen() {
  const [offlineMapStatus, setOfflineMapStatus] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadOfflineStatus();
  }, []);

  const loadOfflineStatus = async () => {
    try {
      const status = await MapModule.getTileCacheStatus?.();
      setOfflineMapStatus(status);
    } catch (error) {
      console.error('Error loading offline status:', error);
    }
  };

  const handlePredownloadMaps = async () => {
    Alert.alert('Download Maps for Offline Use?', 'This will download map tiles for your current area (requires WiFi).', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Download',
        onPress: async () => {
          setDownloading(true);
          try {
            const count = await MapModule.predownloadTilesForRegion?.(
              {
                latitude: 37.78825,
                longitude: -122.4324,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
              },
              [14, 15]
            );
            Alert.alert('Success', `Downloaded ${count || 0} map tiles for offline use`);
            await loadOfflineStatus();
          } catch (error) {
            Alert.alert('Error', 'Failed to download map tiles');
          } finally {
            setDownloading(false);
          }
        },
      },
    ]);
  };

  const handleClearOfflineData = async () => {
    Alert.alert('Clear Offline Data?', 'This will remove all cached maps and offline data.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Clear',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('map_tiles_cache');
            await AsyncStorage.removeItem('map_tiles_index');
            Alert.alert('Cleared', 'Offline data removed');
            await loadOfflineStatus();
          } catch (error) {
            Alert.alert('Error', 'Failed to clear offline data');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Maps</Text>
        
        {offlineMapStatus?.cached ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>✅ Maps available offline</Text>
            <Text style={styles.statusSubtext}>
              Size: {offlineMapStatus.size}
            </Text>
          </View>
        ) : (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>Maps not cached for offline</Text>
            <Text style={styles.statusSubtext}>Download maps while on WiFi</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, downloading && styles.buttonDisabled]}
          onPress={handlePredownloadMaps}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.buttonText}>📥 Download Maps for Offline</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleClearOfflineData}
        >
          <Text style={styles.buttonTextSecondary}>🗑️ Clear Offline Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.infoText}>
          • Download maps while on WiFi for offline use{'\n'}
          • Maps are cached locally on your device{'\n'}
          • Cache expires after 7 days{'\n'}
          • Offline data includes: Maps, Routes, Jobs, Nodes
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  statusSubtext: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonSecondary: {
    backgroundColor: colors.destructive,
  },
  buttonTextSecondary: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  infoText: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 20,
  },
});
