import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { colors } from '../theme/colors';
import * as BT from '@/lib/bluetoothIntegration';

export default function BluetoothScreen() {
  const [discovered, setDiscovered] = useState<BT.BluetoothDevice[]>([]);
  const [connected, setConnected] = useState<BT.BluetoothConnection[]>([]);
  const [readings, setReadings] = useState<BT.BluetoothReading[]>([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => {
    handleStartScan();
  }, []);

  const handleStartScan = async () => {
    setScanning(true);
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      BT.startBluetoothScan();
      setDiscovered(BT.getDiscoveredDevices());
      setScanning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (deviceId: string) => {
    setLoading(true);
    try {
      const success = await BT.connectToDevice(deviceId);
      if (success) {
        setConnected(BT.getConnectedDevices());
        setSelectedDevice(deviceId);
        Alert.alert('Connected', 'Device connected successfully');
        // Simulate reading
        const reading = await BT.readFromDevice(deviceId);
        if (reading) {
          setReadings([reading, ...readings]);
        }
      } else {
        Alert.alert('Error', 'Failed to connect to device');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = (deviceId: string) => {
    BT.disconnectDevice(deviceId);
    setConnected(BT.getConnectedDevices());
    if (selectedDevice === deviceId) {
      setSelectedDevice(null);
    }
  };

  const handleReadDevice = async (deviceId: string) => {
    setLoading(true);
    try {
      const reading = await BT.readFromDevice(deviceId);
      if (reading) {
        setReadings([reading, ...readings]);
        Alert.alert('Reading Captured', `Value: ${reading.value.toFixed(2)} ${reading.unit}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setRefreshing(false);
  };

  const getRSSIColor = (rssi: number) => {
    if (rssi > -50) return colors.chart.green;
    if (rssi > -70) return colors.chart.amber;
    return colors.destructive;
  };

  const getRSSILabel = (rssi: number) => {
    if (rssi > -50) return 'Strong';
    if (rssi > -70) return 'Good';
    return 'Weak';
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Scan Status */}
        <View style={styles.statusCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={[styles.dot, scanning && styles.dotActive]} />
            <Text style={styles.statusText}>{scanning ? 'Scanning' : 'Idle'}</Text>
          </View>
          <Text style={styles.statusDetail}>Discovered: {discovered.length} devices</Text>
          <Text style={styles.statusDetail}>Connected: {connected.length} devices</Text>
        </View>

        {/* Scan Button */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <TouchableOpacity style={styles.scanButton} onPress={handleStartScan}>
            <Text style={styles.scanButtonText}>{scanning ? 'Scanning...' : 'Start Bluetooth Scan'}</Text>
          </TouchableOpacity>
        )}

        {/* Connected Devices */}
        {connected.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connected Devices ({connected.length})</Text>
            {connected.map(conn => (
              <View key={conn.deviceId} style={[styles.deviceCard, styles.connectedCard]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.deviceName}>{conn.deviceName}</Text>
                  <Text style={[styles.badge, { backgroundColor: colors.chart.green + '30', color: colors.chart.green }]}>
                    CONNECTED
                  </Text>
                </View>
                <Text style={styles.deviceInfo}>Status: {conn.status}</Text>
                <Text style={styles.deviceInfo}>Connected: {new Date(conn.connectionTime).toLocaleTimeString()}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.chart.green + '30' }]} onPress={() => handleReadDevice(conn.deviceId)}>
                    <Text style={[styles.actionButtonText, { color: colors.chart.green }]}>Read</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.destructive + '30' }]} onPress={() => handleDisconnect(conn.deviceId)}>
                    <Text style={[styles.actionButtonText, { color: colors.destructive }]}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Available Devices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Devices ({discovered.length})</Text>
          {discovered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No devices discovered. Start scanning to find devices.</Text>
            </View>
          ) : (
            discovered.map(device => (
              <View key={device.id} style={styles.deviceCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceType}>{device.type}</Text>
                  </View>
                  <Text style={[styles.rssi, { color: getRSSIColor(device.rssi) }]}>
                    {getRSSILabel(device.rssi)} ({device.rssi})
                  </Text>
                </View>
                <Text style={styles.deviceInfo}>Last seen: {new Date(device.lastSeen).toLocaleTimeString()}</Text>
                <TouchableOpacity style={styles.connectButton} onPress={() => handleConnect(device.id)}>
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Readings */}
        {readings.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>Device Readings ({readings.length})</Text>
              <TouchableOpacity onPress={() => { BT.clearReadings(); setReadings([]); }}>
                <Text style={{ fontSize: 11, color: colors.primary }}>Clear</Text>
              </TouchableOpacity>
            </View>
            {readings.slice(0, 10).map((reading, idx) => (
              <View key={idx} style={styles.readingCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.readingDevice}>{reading.deviceName}</Text>
                  <Text style={[styles.readingValue, { color: reading.type === 'power' ? colors.chart.cyan : colors.chart.amber }]}>
                    {reading.value.toFixed(2)} {reading.unit}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.readingType}>{reading.type}</Text>
                  <Text style={styles.readingTime}>{new Date(reading.timestamp).toLocaleTimeString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Supported Devices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supported Devices</Text>
          <DeviceInfo type="OTDR" description="Optical Time Domain Reflectometer for fiber testing" />
          <DeviceInfo type="PowerMeter" description="Optical power meter for signal strength measurement" />
          <DeviceInfo type="Other" description="Additional Bluetooth devices and sensors" />
        </View>
      </ScrollView>
    </View>
  );
}

function DeviceInfo({ type, description }: { type: string; description: string }) {
  return (
    <View style={styles.deviceInfo}>
      <Text style={styles.deviceInfoTitle}>{type}</Text>
      <Text style={styles.deviceInfoDesc}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  statusCard: { margin: 12, padding: 16, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.mutedForeground, marginRight: 8 },
  dotActive: { backgroundColor: colors.chart.green },
  statusText: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  statusDetail: { fontSize: 11, color: colors.mutedForeground, marginTop: 4 },
  centerContent: { paddingVertical: 40, alignItems: 'center' },
  scanButton: { marginHorizontal: 12, marginBottom: 12, paddingVertical: 12, backgroundColor: colors.chart.cyan + '20', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: colors.primary },
  scanButtonText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  section: { paddingHorizontal: 12, paddingVertical: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
  deviceCard: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  connectedCard: { borderColor: colors.chart.green, borderWidth: 2, backgroundColor: colors.chart.green + '10' },
  deviceName: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  deviceType: { fontSize: 10, color: colors.mutedForeground, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '600' },
  deviceInfo: { fontSize: 10, color: colors.mutedForeground, marginVertical: 2 },
  rssi: { fontSize: 11, fontWeight: '600' },
  connectButton: { marginTop: 8, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: 4, alignItems: 'center' },
  connectButtonText: { fontSize: 11, fontWeight: '600', color: colors.background },
  actionButton: { flex: 1, paddingVertical: 6, borderRadius: 4, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actionButtonText: { fontSize: 10, fontWeight: '600' },
  readingCard: { backgroundColor: colors.card + '80', borderRadius: 6, padding: 10, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: colors.primary },
  readingDevice: { fontSize: 10, fontWeight: '600', color: colors.foreground },
  readingValue: { fontSize: 11, fontWeight: '600' },
  readingType: { fontSize: 9, color: colors.mutedForeground },
  readingTime: { fontSize: 9, color: colors.mutedForeground },
  emptyState: { alignItems: 'center', paddingVertical: 30, backgroundColor: colors.card, borderRadius: 6, marginBottom: 8 },
  emptyText: { fontSize: 11, color: colors.mutedForeground },
  deviceInfoTitle: { fontSize: 11, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  deviceInfoDesc: { fontSize: 10, color: colors.mutedForeground },
});
