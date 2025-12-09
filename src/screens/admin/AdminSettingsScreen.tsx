import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { colors } from '../../theme/colors';
import { localDataService } from '../../services/LocalDataService';

type SettingsTab = 'general' | 'email' | 'otp' | 'sync';

export function AdminSettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState({
    organizationName: '',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    workingHoursStart: '08:00',
    workingHoursEnd: '17:00',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFromEmail: '',
    smtpFromName: '',
    smtpSecure: true,
    otpEnabled: false,
    otpProvider: 'app',
    otpTwilioSid: '',
    otpTwilioToken: '',
    otpTwilioPhone: '',
    syncEnabled: true,
    syncInterval: '30',
    syncOnWifiOnly: false,
    syncRetryAttempts: '3',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const org = await localDataService.getOrganization(localDataService.getCurrentOrganizationId() || '');
      if (org) {
        const orgSettings = JSON.parse(org.settings || '{}');
        setSettings(prev => ({
          ...prev,
          organizationName: org.name,
          timezone: orgSettings.timezone || prev.timezone,
          dateFormat: orgSettings.dateFormat || prev.dateFormat,
          workingHoursStart: orgSettings.workingHours?.start || prev.workingHoursStart,
          workingHoursEnd: orgSettings.workingHours?.end || prev.workingHoursEnd,
        }));
      }

      const allSettings = await localDataService.getSettings();
      allSettings.forEach(s => {
        if (s.key in settings) {
          setSettings(prev => ({ ...prev, [s.key]: s.value }));
        }
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const orgId = localDataService.getCurrentOrganizationId();
      if (orgId) {
        await localDataService.updateOrganization(orgId, {
          name: settings.organizationName,
          settings: JSON.stringify({
            timezone: settings.timezone,
            dateFormat: settings.dateFormat,
            workingHours: { start: settings.workingHoursStart, end: settings.workingHoursEnd },
          }),
        });
      }

      const settingsToSave = [
        { category: 'email', key: 'smtpHost', value: settings.smtpHost },
        { category: 'email', key: 'smtpPort', value: settings.smtpPort },
        { category: 'email', key: 'smtpUser', value: settings.smtpUser },
        { category: 'email', key: 'smtpFromEmail', value: settings.smtpFromEmail },
        { category: 'email', key: 'smtpFromName', value: settings.smtpFromName },
        { category: 'email', key: 'smtpSecure', value: settings.smtpSecure.toString() },
        { category: 'otp', key: 'otpEnabled', value: settings.otpEnabled.toString() },
        { category: 'otp', key: 'otpProvider', value: settings.otpProvider },
        { category: 'sync', key: 'syncEnabled', value: settings.syncEnabled.toString() },
        { category: 'sync', key: 'syncInterval', value: settings.syncInterval },
        { category: 'sync', key: 'syncOnWifiOnly', value: settings.syncOnWifiOnly.toString() },
        { category: 'sync', key: 'syncRetryAttempts', value: settings.syncRetryAttempts },
      ];

      for (const s of settingsToSave) {
        await localDataService.setSetting(s.category, s.key, s.value);
      }

      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const timezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC', 'Europe/London', 'Asia/Tokyo'];
  const dateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

  const renderGeneralSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Organization</Text>
      <Text style={styles.inputLabel}>Organization Name</Text>
      <TextInput
        style={styles.input}
        value={settings.organizationName}
        onChangeText={v => setSettings({ ...settings, organizationName: v })}
        placeholderTextColor={colors.mutedForeground}
      />

      <Text style={styles.inputLabel}>Timezone</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {timezones.map(tz => (
          <TouchableOpacity
            key={tz}
            style={[styles.chip, settings.timezone === tz && styles.chipActive]}
            onPress={() => setSettings({ ...settings, timezone: tz })}
          >
            <Text style={[styles.chipText, settings.timezone === tz && styles.chipTextActive]}>{tz}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.inputLabel}>Date Format</Text>
      <View style={styles.chipContainer}>
        {dateFormats.map(df => (
          <TouchableOpacity
            key={df}
            style={[styles.chip, settings.dateFormat === df && styles.chipActive]}
            onPress={() => setSettings({ ...settings, dateFormat: df })}
          >
            <Text style={[styles.chipText, settings.dateFormat === df && styles.chipTextActive]}>{df}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Working Hours</Text>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>Start Time</Text>
          <TextInput
            style={styles.input}
            value={settings.workingHoursStart}
            onChangeText={v => setSettings({ ...settings, workingHoursStart: v })}
            placeholder="08:00"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>End Time</Text>
          <TextInput
            style={styles.input}
            value={settings.workingHoursEnd}
            onChangeText={v => setSettings({ ...settings, workingHoursEnd: v })}
            placeholder="17:00"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      </View>
    </View>
  );

  const renderEmailSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>SMTP Configuration</Text>
      <Text style={styles.sectionDesc}>Configure email settings for notifications and password resets.</Text>

      <View style={styles.row}>
        <View style={{ flex: 2 }}>
          <Text style={styles.inputLabel}>SMTP Host</Text>
          <TextInput
            style={styles.input}
            value={settings.smtpHost}
            onChangeText={v => setSettings({ ...settings, smtpHost: v })}
            placeholder="smtp.example.com"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.inputLabel}>Port</Text>
          <TextInput
            style={styles.input}
            value={settings.smtpPort}
            onChangeText={v => setSettings({ ...settings, smtpPort: v })}
            placeholder="587"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.inputLabel}>Username</Text>
      <TextInput
        style={styles.input}
        value={settings.smtpUser}
        onChangeText={v => setSettings({ ...settings, smtpUser: v })}
        placeholder="smtp_user@example.com"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
      />

      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        style={styles.input}
        value={settings.smtpPassword}
        onChangeText={v => setSettings({ ...settings, smtpPassword: v })}
        placeholder="SMTP password"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
      />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>From Email</Text>
          <TextInput
            style={styles.input}
            value={settings.smtpFromEmail}
            onChangeText={v => setSettings({ ...settings, smtpFromEmail: v })}
            placeholder="noreply@example.com"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>From Name</Text>
          <TextInput
            style={styles.input}
            value={settings.smtpFromName}
            onChangeText={v => setSettings({ ...settings, smtpFromName: v })}
            placeholder="FiberTrace"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Use TLS/SSL</Text>
        <Switch
          value={settings.smtpSecure}
          onValueChange={v => setSettings({ ...settings, smtpSecure: v })}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
    </View>
  );

  const renderOTPSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
      <Text style={styles.sectionDesc}>Configure organization-wide OTP settings for enhanced security.</Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enable OTP for Organization</Text>
        <Switch
          value={settings.otpEnabled}
          onValueChange={v => setSettings({ ...settings, otpEnabled: v })}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>

      {settings.otpEnabled && (
        <>
          <Text style={styles.inputLabel}>OTP Provider</Text>
          <View style={styles.chipContainer}>
            {['app', 'sms', 'email'].map(provider => (
              <TouchableOpacity
                key={provider}
                style={[styles.chip, settings.otpProvider === provider && styles.chipActive]}
                onPress={() => setSettings({ ...settings, otpProvider: provider })}
              >
                <Text style={[styles.chipText, settings.otpProvider === provider && styles.chipTextActive]}>
                  {provider === 'app' ? 'Authenticator App' : provider === 'sms' ? 'SMS' : 'Email'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {settings.otpProvider === 'sms' && (
            <>
              <Text style={styles.inputLabel}>Twilio Account SID</Text>
              <TextInput
                style={styles.input}
                value={settings.otpTwilioSid}
                onChangeText={v => setSettings({ ...settings, otpTwilioSid: v })}
                placeholder="ACxxxxx"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={styles.inputLabel}>Twilio Auth Token</Text>
              <TextInput
                style={styles.input}
                value={settings.otpTwilioToken}
                onChangeText={v => setSettings({ ...settings, otpTwilioToken: v })}
                placeholder="Auth token"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
              />
              <Text style={styles.inputLabel}>Twilio Phone Number</Text>
              <TextInput
                style={styles.input}
                value={settings.otpTwilioPhone}
                onChangeText={v => setSettings({ ...settings, otpTwilioPhone: v })}
                placeholder="+1234567890"
                placeholderTextColor={colors.mutedForeground}
              />
            </>
          )}
        </>
      )}
    </View>
  );

  const renderSyncSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sync Configuration</Text>
      <Text style={styles.sectionDesc}>Configure offline sync behavior and frequency.</Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enable Auto Sync</Text>
        <Switch
          value={settings.syncEnabled}
          onValueChange={v => setSettings({ ...settings, syncEnabled: v })}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>

      {settings.syncEnabled && (
        <>
          <Text style={styles.inputLabel}>Sync Interval (minutes)</Text>
          <TextInput
            style={styles.input}
            value={settings.syncInterval}
            onChangeText={v => setSettings({ ...settings, syncInterval: v })}
            placeholder="30"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Sync on WiFi Only</Text>
            <Switch
              value={settings.syncOnWifiOnly}
              onValueChange={v => setSettings({ ...settings, syncOnWifiOnly: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>

          <Text style={styles.inputLabel}>Retry Attempts</Text>
          <TextInput
            style={styles.input}
            value={settings.syncRetryAttempts}
            onChangeText={v => setSettings({ ...settings, syncRetryAttempts: v })}
            placeholder="3"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
          />
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Save All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {(['general', 'email', 'otp', 'sync'] as SettingsTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'email' && renderEmailSettings()}
        {activeTab === 'otp' && renderOTPSettings()}
        {activeTab === 'sync' && renderSyncSettings()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.foreground },
  saveButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonText: { color: colors.background, fontWeight: '600' },
  tabBar: { paddingHorizontal: 16, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderRadius: 8, backgroundColor: colors.card },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, color: colors.mutedForeground, fontWeight: '500' },
  tabTextActive: { color: colors.background },
  content: { flex: 1, paddingHorizontal: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginTop: 16, marginBottom: 8 },
  sectionDesc: { fontSize: 13, color: colors.mutedForeground, marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.card, borderRadius: 8, padding: 12, color: colors.foreground, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  chipScroll: { marginBottom: 8 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.mutedForeground, fontSize: 13 },
  chipTextActive: { color: colors.background },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  switchLabel: { fontSize: 14, color: colors.foreground },
});

export default AdminSettingsScreen;
