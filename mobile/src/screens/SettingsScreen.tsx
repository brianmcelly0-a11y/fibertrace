import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { colors } from '../theme/colors';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [gpsAlways, setGpsAlways] = useState(false);
  const [dataLimit, setDataLimit] = useState(false);

  const handleClearCache = () => {
    Alert.alert('Cache Cleared', 'All cached data has been cleared');
  };

  const handleFactoryReset = () => {
    Alert.alert(
      'Factory Reset',
      'Are you sure? This will clear all local data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => Alert.alert('Reset Complete', 'App reset to factory settings') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <SettingRow label="Dark Mode" value={darkMode} onToggle={setDarkMode} />
      </View>

      {/* Data & Sync */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Sync</Text>
        <SettingRow label="Auto Sync" value={autoSync} onToggle={setAutoSync} />
        <SettingRow label="Always-On GPS" value={gpsAlways} onToggle={setGpsAlways} />
        <SettingRow label="Data Saver Mode" value={dataLimit} onToggle={setDataLimit} />
      </View>

      {/* App Version & Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <InfoRow label="App Version" value="1.0.0" />
        <InfoRow label="Build Number" value="2025.11.26" />
        <InfoRow label="Device ID" value="DEV-2025-001" />
        <InfoRow label="Installed" value="2 weeks ago" />
      </View>

      {/* Storage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <StorageRow label="Cache Size" value="24 MB" />
        <StorageRow label="Local Data" value="156 MB" />
        <StorageRow label="Available" value="2.3 GB" />
        <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
          <Text style={styles.actionButtonText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>

      {/* Developer Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer Options</Text>
        <TouchableOpacity style={styles.devButton}>
          <Text style={styles.devButtonText}>View Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.devButton}>
          <Text style={styles.devButtonText}>Network Monitor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.devButton}>
          <Text style={styles.devButtonText}>Performance Stats</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleFactoryReset}>
          <Text style={styles.dangerButtonText}>Factory Reset</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
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

function SettingRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.primary }} />
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

function StorageRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.storageRow}>
      <Text style={styles.storageLabel}>{label}</Text>
      <Text style={styles.storageValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingBottom: 20 },
  section: { paddingHorizontal: 12, paddingVertical: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: 12, textTransform: 'uppercase' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingLabel: { fontSize: 12, color: colors.foreground },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 11, color: colors.mutedForeground },
  infoValue: { fontSize: 11, fontWeight: '600', color: colors.foreground },
  storageRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  storageLabel: { fontSize: 11, color: colors.mutedForeground },
  storageValue: { fontSize: 11, fontWeight: '600', color: colors.chart.cyan },
  actionButton: { marginTop: 12, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 6, alignItems: 'center' },
  actionButtonText: { fontSize: 11, fontWeight: '600', color: colors.background },
  devButton: { paddingVertical: 12, paddingHorizontal: 12, backgroundColor: colors.card, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  devButtonText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  dangerButton: { paddingVertical: 12, backgroundColor: colors.destructive + '20', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: colors.destructive },
  dangerButtonText: { fontSize: 12, fontWeight: '600', color: colors.destructive },
  aboutCard: { backgroundColor: colors.card, borderRadius: 8, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  aboutTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  aboutVersion: { fontSize: 12, color: colors.mutedForeground, marginBottom: 8 },
  aboutDesc: { fontSize: 11, color: colors.foreground, textAlign: 'center', marginBottom: 8 },
  aboutCopy: { fontSize: 9, color: colors.mutedForeground },
});
