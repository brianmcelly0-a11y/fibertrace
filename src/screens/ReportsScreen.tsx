import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import * as Reports from '@/lib/reportGeneration';

const MOCK_JOBS = Array.from({ length: 25 }, (_, i) => ({
  id: `j${i}`,
  jobId: `JOB-${String(i + 1).padStart(3, '0')}`,
  name: `Job ${i + 1}`,
  description: `Installation and testing work`,
  status: ['Completed', 'In Progress', 'Pending'][Math.floor(Math.random() * 3)],
  actualCost: Math.floor(Math.random() * 3000) + 800,
  estimatedCost: Math.floor(Math.random() * 3500) + 1000,
  duration: Math.floor(Math.random() * 28800) + 3600,
  assignedTechnician: ['John Doe', 'Jane Smith', 'Mike Johnson'][Math.floor(Math.random() * 3)],
}));

const MOCK_TECHNICIANS = [
  { id: 't1', name: 'John Doe', role: 'Technician', currentUtilization: 75 },
  { id: 't2', name: 'Jane Smith', role: 'Technician', currentUtilization: 65 },
  { id: 't3', name: 'Mike Johnson', role: 'Team Lead', currentUtilization: 85 },
];

const MOCK_INVENTORY = [
  { id: 'inv1', name: 'SMF Cable', currentStock: 450, minimumStock: 100, costPerUnit: 125 },
  { id: 'inv2', name: 'Splitters', currentStock: 85, minimumStock: 20, costPerUnit: 450 },
  { id: 'inv3', name: 'Connectors', currentStock: 1200, minimumStock: 200, costPerUnit: 12 },
];

export default function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState<Reports.ReportType>('JobCompletion');
  const [selectedFormat, setSelectedFormat] = useState<Reports.ReportFormat>('PDF');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<Reports.ReportData | null>(null);

  const generateReport = async (type: Reports.ReportType) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      let report: Reports.ReportData;
      
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
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Report Types */}
        <Text style={styles.sectionTitle}>Available Reports</Text>
        
        <ReportTypeCard
          title="Job Completion"
          description="Jobs completed, costs, durations"
          selected={selectedReport === 'JobCompletion'}
          onPress={() => { setSelectedReport('JobCompletion'); generateReport('JobCompletion'); }}
        />
        
        <ReportTypeCard
          title="Team Performance"
          description="Technician utilization and productivity"
          selected={selectedReport === 'TeamPerformance'}
          onPress={() => { setSelectedReport('TeamPerformance'); generateReport('TeamPerformance'); }}
        />
        
        <ReportTypeCard
          title="Inventory Status"
          description="Stock levels and material costs"
          selected={selectedReport === 'Inventory'}
          onPress={() => { setSelectedReport('Inventory'); }}
        />

        {/* Export Formats */}
        <Text style={styles.sectionTitle}>Export Format</Text>
        <View style={styles.formatsContainer}>
          {['PDF', 'CSV', 'JSON', 'Excel'].map(format => (
            <TouchableOpacity key={format} style={[styles.formatButton, selectedFormat === format && styles.formatButtonActive]} onPress={() => setSelectedFormat(format as Reports.ReportFormat)}>
              <Text style={[styles.formatButtonText, selectedFormat === format && styles.formatButtonTextActive]}>{format}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate Button */}
        <TouchableOpacity 
          style={[styles.generateButton, loading && styles.generateButtonDisabled]} 
          onPress={() => generateReport(selectedReport)}
          disabled={loading}
        >
          <Text style={styles.generateButtonText}>{loading ? 'Generating...' : 'Generate Report'}</Text>
        </TouchableOpacity>

        {/* Generated Report Summary */}
        {generatedReport && (
          <View style={styles.reportSummary}>
            <Text style={styles.sectionTitle}>Generated Report Summary</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{generatedReport.title}</Text>
              <Text style={styles.summaryMeta}>Period: {generatedReport.period}</Text>
              <Text style={styles.summaryMeta}>Format: {selectedFormat}</Text>
              <Text style={styles.summaryMeta}>Records: {generatedReport.details.length}</Text>
              {generatedReport.summary && Object.entries(generatedReport.summary).map(([key, value]) => (
                <Text key={key} style={styles.summaryData}>{key}: {typeof value === 'number' ? value.toFixed(2) : value}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Recent Reports */}
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        <RecentReportItem date="Today" report={`${selectedReport} (${selectedFormat})`} size="2.4 MB" />
        <RecentReportItem date="Yesterday" report="Team Performance (CSV)" size="156 KB" />
        <RecentReportItem date="2 days ago" report="Inventory Status (JSON)" size="892 KB" />
        <RecentReportItem date="3 days ago" report="Job Completion (PDF)" size="4.1 MB" />

        {/* Features */}
        <Text style={styles.sectionTitle}>Report Features</Text>
        <FeatureItem title="Multi-format Export" description="PDF, CSV, JSON, Excel support" />
        <FeatureItem title="Custom Filtering" description="Filter by date, technician, status" />
        <FeatureItem title="Real-time Data" description="Live job and inventory data included" />
        <FeatureItem title="Scheduled Reports" description="Coming soon - automated report generation" />
      </ScrollView>
    </View>
  );
}

function ReportTypeCard({ title, description, selected, onPress }: { title: string; description: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.reportCard, selected && styles.reportCardSelected]}
      onPress={onPress}
    >
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
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground, paddingHorizontal: 12, paddingVertical: 10 },
  reportCard: { marginHorizontal: 12, marginBottom: 8, padding: 12, backgroundColor: colors.card, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  reportCardSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + '15' },
  reportCardTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  reportCardDescription: { fontSize: 11, color: colors.mutedForeground },
  formatsContainer: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  formatButton: { flex: 1, paddingVertical: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 4, alignItems: 'center' },
  formatButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  formatButtonText: { fontSize: 11, fontWeight: '600', color: colors.foreground },
  formatButtonTextActive: { color: colors.background },
  generateButton: { marginHorizontal: 12, marginBottom: 12, paddingVertical: 12, backgroundColor: colors.chart.green, borderRadius: 6, alignItems: 'center' },
  generateButtonDisabled: { opacity: 0.6 },
  generateButtonText: { fontSize: 13, fontWeight: '600', color: colors.background },
  reportSummary: { paddingHorizontal: 12, marginBottom: 12 },
  summaryCard: { backgroundColor: colors.card, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: colors.primary },
  summaryTitle: { fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  summaryMeta: { fontSize: 10, color: colors.mutedForeground, marginBottom: 4 },
  summaryData: { fontSize: 10, color: colors.foreground, marginBottom: 2 },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { fontSize: 13, color: colors.mutedForeground, marginTop: 12 },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  recentDate: { fontSize: 10, color: colors.mutedForeground, marginBottom: 2 },
  recentReport: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  recentSize: { fontSize: 10, color: colors.chart.green, fontWeight: '600' },
  featureItem: { marginHorizontal: 12, marginBottom: 8, padding: 12, backgroundColor: colors.card, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  featureTitle: { fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  featureDescription: { fontSize: 11, color: colors.mutedForeground },
});
