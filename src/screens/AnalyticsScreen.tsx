import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import * as Analytics from '@/lib/analytics';

const MOCK_JOBS: any[] = Array.from({ length: 25 }, (_, i) => ({
  id: `j${i}`,
  status: ['Completed', 'In Progress', 'Pending'][Math.floor(Math.random() * 3)],
  duration: Math.floor(Math.random() * 14400) + 3600,
  estimatedCost: Math.floor(Math.random() * 2000) + 500,
  actualCost: Math.floor(Math.random() * 2200) + 450,
}));

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState('Monthly');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
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

  const report = Analytics.generateAnalyticsReport(MOCK_JOBS, period);
  const metrics = Analytics.getPerformanceMetrics(MOCK_JOBS);
  const costBreakdown = Analytics.getCostBreakdown(MOCK_JOBS);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.periodButtonActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <MetricBox label="Jobs Completed" value={String(report.jobsCompleted)} color={colors.chart.green} />
        <MetricBox label="Avg Completion" value={`${(report.averageCompletionTime / 60).toFixed(1)}h`} color={colors.primary} />
        <MetricBox label="Cost Per Job" value={`$${report.costPerJob.toFixed(0)}`} color={colors.chart.amber} />
        <MetricBox label="Profit Margin" value={`${report.profitMargin}%`} color={colors.chart.green} />
      </View>

      {/* Performance Metrics */}
      <Text style={styles.sectionTitle}>Performance</Text>
      {metrics.map((metric, idx) => (
        <View key={idx} style={styles.metricRow}>
          <View>
            <Text style={styles.metricName}>{metric.metric}</Text>
            <Text style={styles.metricSubtext}>Target: {metric.target}%</Text>
          </View>
          <View style={styles.metricBar}>
            <View
              style={[
                styles.metricBarFill,
                {
                  width: `${Math.min(metric.value, 100)}%`,
                  backgroundColor:
                    metric.status === 'On Target'
                      ? colors.chart.green
                      : metric.status === 'Below Target'
                      ? colors.destructive
                      : colors.chart.amber,
                },
              ]}
            />
          </View>
          <Text style={styles.metricValue}>{metric.value.toFixed(0)}%</Text>
        </View>
      ))}

      {/* Cost Breakdown */}
      <Text style={styles.sectionTitle}>Cost Breakdown</Text>
      <View style={styles.costContainer}>
        {costBreakdown.map((item, idx) => (
          <View key={idx} style={styles.costItem}>
            <Text style={styles.costLabel}>{item.category}</Text>
            <Text style={styles.costAmount}>${item.amount.toFixed(0)}</Text>
            <View style={styles.costBar}>
              <View
                style={[
                  styles.costBarFill,
                  { width: `${item.percentage}%`, backgroundColor: [colors.primary, colors.chart.green, colors.chart.amber][idx] },
                ]}
              />
            </View>
            <Text style={styles.costPercent}>{item.percentage}%</Text>
          </View>
        ))}
      </View>

      {/* Revenue Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Revenue Summary</Text>
        <SummaryRow label="Total Revenue" value={`$${report.totalRevenue.toFixed(0)}`} />
        <SummaryRow label="Material Cost" value={`$${report.materialCost.toFixed(0)}`} />
        <SummaryRow label="Labor Cost" value={`$${report.laborCost.toFixed(0)}`} />
        <View style={styles.divider} />
        <SummaryRow label="Net Profit" value={`$${(report.totalRevenue * report.profitMargin / 100).toFixed(0)}`} highlight />
      </View>
    </ScrollView>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricBoxLabel}>{label}</Text>
      <Text style={[styles.metricBoxValue, { color }]}>{value}</Text>
    </View>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.summaryRow, highlight && styles.summaryRowHighlight]}>
      <Text style={[styles.summaryLabel, highlight && styles.summaryLabelHighlight]}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingText: { fontSize: 14, color: colors.mutedForeground, marginTop: 12 },
  periodSelector: { flexDirection: 'row', padding: 12, gap: 8 },
  periodButton: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  periodButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodButtonText: { fontSize: 12, fontWeight: '600', color: colors.mutedForeground, textAlign: 'center' },
  periodButtonTextActive: { color: colors.background },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  metricBox: { width: '50%', paddingHorizontal: 4, paddingVertical: 8 },
  metricBoxLabel: { fontSize: 11, color: colors.mutedForeground, marginBottom: 4 },
  metricBoxValue: { fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  metricRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  metricName: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 2 },
  metricSubtext: { fontSize: 11, color: colors.mutedForeground },
  metricBar: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  metricBarFill: { height: '100%', borderRadius: 3 },
  metricValue: { fontSize: 12, fontWeight: '600', color: colors.primary, minWidth: 45, textAlign: 'right' },
  costContainer: { paddingHorizontal: 12, paddingVertical: 8, gap: 12 },
  costItem: { backgroundColor: colors.card, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: colors.border },
  costLabel: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 6 },
  costAmount: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginBottom: 6 },
  costBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginBottom: 4, overflow: 'hidden' },
  costBarFill: { height: '100%', borderRadius: 2 },
  costPercent: { fontSize: 11, color: colors.mutedForeground },
  summaryCard: { margin: 12, backgroundColor: colors.card, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: colors.border },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryRowHighlight: { backgroundColor: colors.primary + '20', paddingHorizontal: 8, marginHorizontal: -8, borderRadius: 4 },
  summaryLabel: { fontSize: 13, color: colors.mutedForeground },
  summaryLabelHighlight: { color: colors.foreground, fontWeight: '600' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  summaryValueHighlight: { color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
});
