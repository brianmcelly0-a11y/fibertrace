import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import * as Scheduling from '@/lib/scheduling';

const MOCK_TECHNICIANS: Scheduling.Technician[] = [
  { id: 't1', name: 'John Doe', email: 'john@tech.com', role: 'Technician', availableHoursPerWeek: 40, currentUtilization: 75, skills: ['Installation', 'Troubleshooting'] },
  { id: 't2', name: 'Jane Smith', email: 'jane@tech.com', role: 'Technician', availableHoursPerWeek: 40, currentUtilization: 65, skills: ['Installation', 'Splicing'] },
  { id: 't3', name: 'Mike Johnson', email: 'mike@tech.com', role: 'Team Lead', availableHoursPerWeek: 35, currentUtilization: 85, skills: ['All'] },
  { id: 't4', name: 'Sarah Lee', email: 'sarah@tech.com', role: 'Technician', availableHoursPerWeek: 40, currentUtilization: 58, skills: ['Testing', 'Troubleshooting'] },
];

const MOCK_ASSIGNMENTS: Scheduling.JobAssignment[] = [
  { id: 'a1', jobId: 'j1', technicianId: 't1', assignedDate: new Date().toISOString(), startDate: new Date().toISOString(), endDate: new Date(Date.now() + 28800000).toISOString(), estimatedHours: 8, priority: 'High', status: 'In Progress' },
  { id: 'a2', jobId: 'j2', technicianId: 't2', assignedDate: new Date().toISOString(), startDate: new Date().toISOString(), endDate: new Date(Date.now() + 14400000).toISOString(), estimatedHours: 4, priority: 'Medium', status: 'Assigned' },
  { id: 'a3', jobId: 'j3', technicianId: 't3', assignedDate: new Date().toISOString(), startDate: new Date().toISOString(), endDate: new Date(Date.now() + 32400000).toISOString(), estimatedHours: 9, priority: 'Critical', status: 'In Progress' },
];

export default function ScheduleScreen() {
  const [technicians, setTechnicians] = useState<Scheduling.Technician[]>(MOCK_TECHNICIANS);
  const [assignments] = useState<Scheduling.JobAssignment[]>(MOCK_ASSIGNMENTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setTechnicians(MOCK_TECHNICIANS);
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
  const workload = Scheduling.getTeamWorkload(technicians, assignments);
  const metrics = Scheduling.getScheduleMetrics(technicians, assignments);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Metrics */}
        <View style={styles.metricsContainer}>
        <MetricCard label="Avg Utilization" value={`${metrics.averageUtilization.toFixed(0)}%`} />
        <MetricCard label="Scheduled Jobs" value={String(metrics.scheduledJobs)} />
        <MetricCard label="Completion Rate" value={`${metrics.completionRate.toFixed(0)}%`} />
      </View>

      {/* Team Workload */}
      <Text style={styles.sectionTitle}>Team Workload</Text>
      <ScrollView style={styles.workloadList} horizontal>
        {workload.map((item, idx) => (
          <View key={idx} style={styles.workloadCard}>
            <Text style={styles.techName}>{item.technician}</Text>
            <View style={styles.utilBar}>
              <View style={[styles.utilFill, { width: `${item.utilization}%`, backgroundColor: item.utilization > 90 ? colors.destructive : colors.chart.green }]} />
            </View>
            <Text style={styles.utilText}>{item.utilization.toFixed(0)}% • {item.jobsAssigned} jobs</Text>
            <Text style={[styles.status, { color: item.status === 'Overbooked' ? colors.destructive : colors.chart.green }]}>
              {item.status}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Calendar View */}
      <Text style={styles.sectionTitle}>This Week</Text>
      <ScrollView style={styles.calendarContainer}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
          <View key={idx} style={styles.dayCard}>
            <Text style={styles.dayName}>{day}</Text>
            <View style={styles.dayContent}>
              <View style={styles.shiftIndicator} />
              <Text style={styles.shiftText}>{2 + idx} Shifts</Text>
            </View>
          </View>
        ))}
      </ScrollView>

        {/* Key Metrics */}
        <View style={styles.detailsContainer}>
          <DetailRow label="Total Technicians" value={String(metrics.totalTechnicians)} />
          <DetailRow label="Available Capacity" value={`${(100 - metrics.averageUtilization).toFixed(0)}%`} />
          <DetailRow label="Avg Completion Time" value={`${(metrics.averageCompletionTime / 60).toFixed(0)}h`} />
        </View>
      </ScrollView>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingText: { fontSize: 14, color: colors.mutedForeground, marginTop: 12 },
  metricsContainer: { flexDirection: 'row', padding: 12, gap: 8 },
  metricCard: { flex: 1, backgroundColor: colors.card, borderRadius: 6, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  metricLabel: { fontSize: 11, color: colors.mutedForeground, marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground, paddingHorizontal: 12, paddingVertical: 8 },
  workloadList: { height: 140, paddingHorizontal: 12, marginBottom: 12 },
  workloadCard: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginRight: 8, width: 140, borderWidth: 1, borderColor: colors.border },
  techName: { fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 6 },
  utilBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  utilFill: { height: '100%', borderRadius: 3 },
  utilText: { fontSize: 11, color: colors.mutedForeground, marginBottom: 4 },
  status: { fontSize: 11, fontWeight: '600' },
  calendarContainer: { paddingHorizontal: 12, marginBottom: 12, maxHeight: 120 },
  dayCard: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginRight: 8, width: 100, borderWidth: 1, borderColor: colors.border },
  dayName: { fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
  dayContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shiftIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  shiftText: { fontSize: 11, color: colors.mutedForeground },
  detailsContainer: { paddingHorizontal: 12, paddingVertical: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 13, color: colors.mutedForeground },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.foreground },
});
