import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import * as GPS from '@/lib/gpsTracking';

export default function GPSTrackingScreen() {
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState<GPS.TrackingSession | null>(null);
  const [metrics, setMetrics] = useState<GPS.TrackingMetrics | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const mockLocation: GPS.Location = {
    latitude: 40.7128,
    longitude: -74.006,
    accuracy: 5,
    timestamp: new Date().toISOString(),
  };

  React.useEffect(() => {
    if (!tracking) return;
    const interval = setInterval(() => {
      setElapsedTime(t => t + 1);
      if (session) {
        // Simulate location update
        const newLoc: GPS.Location = {
          latitude: mockLocation.latitude + (Math.random() - 0.5) * 0.001,
          longitude: mockLocation.longitude + (Math.random() - 0.5) * 0.001,
          accuracy: 5,
          timestamp: new Date().toISOString(),
        };
        const updatedSession = GPS.updateLocation(session, newLoc);
        setSession(updatedSession);
        setMetrics(GPS.calculateTrackingMetrics(updatedSession));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [tracking, session]);

  const handleStartTracking = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newSession = GPS.startTracking('JOB-001', 'tech-001', mockLocation);
      setSession(newSession);
      setMetrics(GPS.calculateTrackingMetrics(newSession));
      setTracking(true);
      setElapsedTime(0);
    } finally {
      setLoading(false);
    }
  };

  const handleStopTracking = async () => {
    if (!session) return;
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const completed = GPS.completeTracking(session);
      const finalMetrics = GPS.calculateTrackingMetrics(completed);
      setSession(completed);
      setMetrics(finalMetrics);
      setTracking(false);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Status Card */}
        <View style={[styles.statusCard, tracking && { borderColor: colors.chart.green, borderWidth: 2, backgroundColor: colors.chart.green + '10' }]}>
          <View style={styles.statusIndicator}>
            <View style={[styles.dot, tracking && styles.dotActive]} />
            <Text style={styles.statusText}>{tracking ? 'Tracking Active' : 'Not Tracking'}</Text>
          </View>
          {session && (
            <View style={styles.statusDetails}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Distance:</Text>
                <Text style={styles.statusValue}>{(session.distance / 1000).toFixed(2)} km</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Job:</Text>
                <Text style={styles.statusValue}>{session.jobId}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Points:</Text>
                <Text style={styles.statusValue}>{session.path.length}</Text>
              </View>
              {metrics && tracking && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Avg Speed:</Text>
                  <Text style={styles.statusValue}>{(metrics.averageSpeed * 3.6).toFixed(1)} km/h</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Controls */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.controlsContainer}>
            {!tracking ? (
              <TouchableOpacity style={styles.startButton} onPress={handleStartTracking}>
                <Text style={styles.buttonText}>Start Tracking</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.startButton, styles.stopButton]} onPress={handleStopTracking}>
                <Text style={styles.buttonText}>Stop Tracking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Metrics */}
        {session && metrics && (
          <View style={styles.metricsContainer}>
            <Text style={styles.sectionTitle}>Session Metrics</Text>
            <MetricRow label="Total Distance" value={`${(session.distance / 1000).toFixed(3)} km`} />
            <MetricRow label="Path Points" value={String(session.path.length)} />
            <MetricRow label="Elapsed Time" value={`${Math.floor(elapsedTime / 60)}:${String(elapsedTime % 60).padStart(2, '0')}`} color={colors.primary} />
            <MetricRow label="Avg Speed" value={`${(metrics.averageSpeed * 3.6).toFixed(1)} km/h`} />
            <MetricRow label="Route Efficiency" value={`${metrics.routeEfficiency.toFixed(0)}%`} />
            <MetricRow label="Start Location" value={`${session.startLocation.latitude.toFixed(4)}, ${session.startLocation.longitude.toFixed(4)}`} />
            <MetricRow label="Current Location" value={`${session.currentLocation.latitude.toFixed(4)}, ${session.currentLocation.longitude.toFixed(4)}`} />
            <MetricRow label="Status" value={session.status} color={session.status === 'Completed' ? colors.chart.green : colors.primary} />
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>GPS Features</Text>
          <FeatureItem title="Real-time Tracking" description="Track technician location during jobs" />
          <FeatureItem title="Route Optimization" description="Automatic route path recording" />
          <FeatureItem title="Distance Calculation" description="Haversine-based distance measurement" />
          <FeatureItem title="Geofencing" description="Coming soon - location-based alerts" />
        </View>
      </ScrollView>
    </View>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, color && { color }]}>{value}</Text>
    </View>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  statusCard: { margin: 12, padding: 16, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.mutedForeground },
  dotActive: { backgroundColor: colors.chart.green },
  statusText: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  statusDetails: { gap: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusLabel: { fontSize: 12, color: colors.mutedForeground },
  statusValue: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  statusDetail: { fontSize: 12, color: colors.mutedForeground, marginVertical: 2 },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  controlsContainer: { paddingHorizontal: 12, paddingVertical: 8 },
  startButton: { backgroundColor: colors.chart.green, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  stopButton: { backgroundColor: colors.destructive },
  buttonText: { fontSize: 14, fontWeight: '600', color: colors.background },
  metricsContainer: { padding: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  metricLabel: { fontSize: 13, color: colors.mutedForeground },
  metricValue: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  featuresContainer: { paddingHorizontal: 12, paddingBottom: 20 },
  featureItem: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  featureTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  featureDescription: { fontSize: 12, color: colors.mutedForeground },
});
