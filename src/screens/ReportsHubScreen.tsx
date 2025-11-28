import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import * as ReportingCharts from '@/lib/reportingCharts';

type TabType = 'analytics' | 'export';

const MOCK_JOBS: any[] = Array.from({ length: 30 }, (_, i) => ({
  jobId: `JOB-${String(i + 1).padStart(3, '0')}`,
  status: ['Completed', 'In Progress', 'Pending'][Math.floor(Math.random() * 3)],
  duration: Math.floor(Math.random() * 14400) + 3600,
  assignedTechnician: ['John Doe', 'Jane Smith', 'Mike Johnson'][Math.floor(Math.random() * 3)],
}));

export default function ReportsHubScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'analytics', label: 'Analytics', icon: '📊' },
    { key: 'export', label: 'Export', icon: '📥' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'export' && <ExportTab />}
      </View>
    </View>
  );
}

function AnalyticsTab() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setRefreshing(false);
  };

  const metrics = ReportingCharts.getJobMetrics(MOCK_JOBS);
  const pieData = ReportingCharts.generatePieChartData(MOCK_JOBS);
  const waveData = ReportingCharts.generateWaveChartData(MOCK_JOBS);
  const techPerf = ReportingCharts.getTechnicianPerformance(MOCK_JOBS);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <View style={styles.metricsGrid}>
        <MetricBox label="Completed" value={String(metrics.jobsCompleted)} color={colors.chart.green} />
        <MetricBox label="In Progress" value={String(metrics.jobsInProgress)} color={colors.primary} />
        <MetricBox label="Avg Time" value={`${(metrics.averageCompletionTime / 3600).toFixed(1)}h`} color={colors.chart.amber} />
        <MetricBox label="Total Hours" value={metrics.totalHoursLogged.toFixed(0)} color={colors.chart.cyan} />
      </View>

      <Text style={styles.sectionTitle}>Job Distribution (Pie Chart)</Text>
      <View style={styles.chartContainer}>
        {pieData.map((item, idx) => (
          <View key={idx} style={styles.pieItem}>
            <View style={[styles.pieColor, { backgroundColor: item.color }]} />
            <Text style={styles.pieLabel}>{item.label}: {item.value}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Performance Trend (Wave Chart)</Text>
      <View style={styles.waveChart}>
        {waveData.map((point, idx) => (
          <View key={idx} style={[styles.waveBar, { height: (point.value / 100) * 100 + 20 }]} />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Technician Performance</Text>
      {techPerf.map((tech, idx) => (
        <View key={idx} style={styles.techCard}>
          <View style={styles.techHeader}>
            <Text style={styles.techName}>{tech.name}</Text>
            <Text style={styles.techRate}>{tech.completionRate}%</Text>
          </View>
          <View style={styles.techStats}>
            <Text style={styles.techStat}>Jobs: {tech.totalJobs}</Text>
            <Text style={styles.techStat}>Hours: {tech.hoursLogged}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function ExportTab() {
  const [loading, setLoading] = useState(false);

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const csv = ReportingCharts.exportDataToCSV(MOCK_JOBS, 'jobs-report');
      Alert.alert('✓ Export Successful', `CSV generated with ${csv.split('\n').length} rows ready for download`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const pdf = ReportingCharts.formatDataForPDF(MOCK_JOBS, ReportingCharts.getJobMetrics(MOCK_JOBS));
      Alert.alert('✓ PDF Generated', pdf.substring(0, 150) + '...\n\nPDF report ready for download');
    } finally {
      setLoading(false);
    }
  };
      
      if (type === 'JobCompletion') {
        report = Reports.generateJobCompletionReport(MOCK_JOBS, 'Monthly');
      } else if (type === 'TeamPerformance') {
        report = Reports.generateTeamPerformanceReport(MOCK_TECHNICIANS, []);
      } else {
        report = Reports.generateInventoryReport(MOCK_INVENTORY);
      }
      
      setGeneratedReport(report);
      Alert.alert('Success', `${type} report generated!\n\nFormat: ${selectedFormat}\nRecords: ${report.details.length}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setRefreshing(false);
  };

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <Text style={styles.sectionTitle}>Available Reports</Text>
      
      <ReportTypeCard
        title="Job Completion"
        description="Jobs completed, costs, durations"
        selected={selectedReport === 'JobCompletion'}
        onPress={() => { setSelectedReport('JobCompletion'); }}
      />
      
      <ReportTypeCard
        title="Team Performance"
        description="Technician utilization and productivity"
        selected={selectedReport === 'TeamPerformance'}
        onPress={() => { setSelectedReport('TeamPerformance'); }}
      />
      
      <ReportTypeCard
        title="Inventory Status"
        description="Stock levels and material costs"
        selected={selectedReport === 'Inventory'}
        onPress={() => { setSelectedReport('Inventory'); }}
      />

      <Text style={styles.sectionTitle}>Export Format</Text>
      <View style={styles.formatsContainer}>
        {['PDF', 'CSV', 'JSON', 'Excel'].map(format => (
          <TouchableOpacity
            key={format}
            style={[styles.formatButton, selectedFormat === format && styles.formatButtonActive]}
            onPress={() => setSelectedFormat(format as Reports.ReportFormat)}
          >
            <Text style={[styles.formatButtonText, selectedFormat === format && styles.formatButtonTextActive]}>{format}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.generateButton, loading && styles.generateButtonDisabled]} 
        onPress={() => generateReport(selectedReport)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <Text style={styles.generateButtonText}>Generate Report</Text>
        )}
      </TouchableOpacity>

      {generatedReport && (
        <View style={styles.reportSummary}>
          <Text style={styles.sectionTitle}>Generated Report</Text>
          <View style={styles.generatedCard}>
            <Text style={styles.generatedTitle}>{generatedReport.title}</Text>
            <Text style={styles.generatedMeta}>Period: {generatedReport.period}</Text>
            <Text style={styles.generatedMeta}>Format: {selectedFormat}</Text>
            <Text style={styles.generatedMeta}>Records: {generatedReport.details.length}</Text>
            {generatedReport.summary && Object.entries(generatedReport.summary).slice(0, 3).map(([key, value]) => (
              <Text key={key} style={styles.generatedData}>{key}: {typeof value === 'number' ? value.toFixed(2) : value}</Text>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Reports</Text>
      <RecentReportItem date="Today" report={`${selectedReport} (${selectedFormat})`} size="2.4 MB" />
      <RecentReportItem date="Yesterday" report="Team Performance (CSV)" size="156 KB" />
      <RecentReportItem date="2 days ago" report="Inventory Status (JSON)" size="892 KB" />
      <RecentReportItem date="3 days ago" report="Job Completion (PDF)" size="4.1 MB" />

      <Text style={styles.sectionTitle}>Report Features</Text>
      <FeatureItem title="Multi-format Export" description="PDF, CSV, JSON, Excel support" />
      <FeatureItem title="Custom Filtering" description="Filter by date, technician, status" />
      <FeatureItem title="Real-time Data" description="Live job and inventory data included" />
      <FeatureItem title="Scheduled Reports" description="Coming soon - automated generation" />
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

function ReportTypeCard({ title, description, selected, onPress }: { title: string; description: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.reportCard, selected && styles.reportCardSelected]} onPress={onPress}>
      <Text style={styles.reportCardTitle}>{title}</Text>
      <Text style={styles.reportCardDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

function RecentReportItem({ date, report, size }: { date: string; report: string; size: string }) {
  return (
    <View style={styles.recentItem}>
      <View>
        <Text style={styles.recentDate}>{date}</Text>
        <Text style={styles.recentReport}>{report}</Text>
      </View>
      <Text style={styles.recentSize}>{size}</Text>
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
  tabContainer: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabIcon: { fontSize: 16, marginBottom: 4 },
  tabLabel: { fontSize: 10, color: colors.mutedForeground, fontWeight: '500' },
  tabLabelActive: { color: colors.primary, fontWeight: '600' },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 13, color: colors.mutedForeground, marginTop: 12 },
  periodSelector: { flexDirection: 'row', padding: 12, gap: 8 },
  periodButton: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  periodButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodButtonText: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground, textAlign: 'center' },
  periodButtonTextActive: { color: colors.background },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  metricBox: { width: '50%', paddingHorizontal: 4, paddingVertical: 8 },
  metricBoxLabel: { fontSize: 10, color: colors.mutedForeground, marginBottom: 4 },
  metricBoxValue: { fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  metricRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  metricName: { fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 2 },
  metricSubtext: { fontSize: 10, color: colors.mutedForeground },
  metricBar: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  metricBarFill: { height: '100%', borderRadius: 3 },
  metricValue: { fontSize: 11, fontWeight: '600', color: colors.primary, minWidth: 40, textAlign: 'right' },
  costContainer: { paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
  costItem: { backgroundColor: colors.card, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: colors.border },
  costLabel: { fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  costAmount: { fontSize: 13, fontWeight: 'bold', color: colors.primary, marginBottom: 6 },
  costBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginBottom: 4, overflow: 'hidden' },
  costBarFill: { height: '100%', borderRadius: 2 },
  costPercent: { fontSize: 10, color: colors.mutedForeground },
  summaryCard: { margin: 12, backgroundColor: colors.card, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: colors.border },
  summaryTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryRowHighlight: { backgroundColor: colors.primary + '20', paddingHorizontal: 8, marginHorizontal: -8, borderRadius: 4 },
  summaryLabel: { fontSize: 12, color: colors.mutedForeground },
  summaryLabelHighlight: { color: colors.foreground, fontWeight: '600' },
  summaryValue: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  summaryValueHighlight: { color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  reportCard: { marginHorizontal: 12, marginBottom: 8, padding: 12, backgroundColor: colors.card, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  reportCardSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + '15' },
  reportCardTitle: { fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  reportCardDescription: { fontSize: 10, color: colors.mutedForeground },
  formatsContainer: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  formatButton: { flex: 1, paddingVertical: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 4, alignItems: 'center' },
  formatButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  formatButtonText: { fontSize: 10, fontWeight: '600', color: colors.foreground },
  formatButtonTextActive: { color: colors.background },
  generateButton: { marginHorizontal: 12, marginBottom: 12, paddingVertical: 12, backgroundColor: colors.chart.green, borderRadius: 6, alignItems: 'center' },
  generateButtonDisabled: { opacity: 0.6 },
  generateButtonText: { fontSize: 12, fontWeight: '600', color: colors.background },
  reportSummary: { paddingHorizontal: 0, marginBottom: 12 },
  generatedCard: { marginHorizontal: 12, backgroundColor: colors.card, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: colors.primary },
  generatedTitle: { fontSize: 11, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  generatedMeta: { fontSize: 9, color: colors.mutedForeground, marginBottom: 4 },
  generatedData: { fontSize: 9, color: colors.foreground, marginBottom: 2 },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  recentDate: { fontSize: 9, color: colors.mutedForeground, marginBottom: 2 },
  recentReport: { fontSize: 11, fontWeight: '600', color: colors.foreground },
  recentSize: { fontSize: 9, color: colors.chart.green, fontWeight: '600' },
  featureItem: { marginHorizontal: 12, marginBottom: 8, padding: 12, backgroundColor: colors.card, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  featureTitle: { fontSize: 11, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  featureDescription: { fontSize: 10, color: colors.mutedForeground },
});
