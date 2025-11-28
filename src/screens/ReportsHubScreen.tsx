import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

type ReportType = 'route' | 'splice' | 'closure' | 'power' | 'technician';

// Mock data for reports
const MOCK_ROUTES = [
  { id: 'r1', name: 'Main Street Fiber', length: 12.5, nodes: 8, closures: 5, status: 'Active' },
  { id: 'r2', name: 'Downtown Loop', length: 8.3, nodes: 5, closures: 3, status: 'Active' },
];

const MOCK_CLOSURES = [
  { id: 'c1', type: 'FAT', cores: 48, splices: 12, location: 'Pole 45', status: 'Good' },
  { id: 'c2', type: 'ATB', cores: 144, splices: 28, location: 'Ground', status: 'Good' },
];

const MOCK_SPLICE_DATA = [
  { closure: 'FAT-001', fibers: 12, avgLoss: 0.15, maxLoss: 0.45 },
  { closure: 'ATB-001', fibers: 28, avgLoss: 0.12, maxLoss: 0.38 },
];

const MOCK_POWER = [
  { node: 'OLT-01', powerIn: 20, powerOut: 18.5, loss: 1.5 },
  { node: 'Splitter-01', powerIn: 18.5, powerOut: 8.5, loss: 10 },
];

export default function ReportsHubScreen() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('route');
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async (type: ReportType) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
    Alert.alert('✓ Report Generated', `${type.charAt(0).toUpperCase() + type.slice(1)} report ready for export`);
  };

  const handleExportCSV = () => {
    Alert.alert('✓ CSV Export', 'Report exported successfully');
  };

  const handleExportPDF = () => {
    Alert.alert('✓ PDF Export', 'Report generated successfully');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generating report...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Technical Reports</Text>

        {/* Route Reports */}
        <TouchableOpacity
          style={[styles.reportCard, selectedReport === 'route' && styles.reportCardActive]}
          onPress={() => setSelectedReport('route')}
        >
          <Text style={styles.reportIcon}>🛣️</Text>
          <View style={styles.reportInfo}>
            <Text style={styles.reportName}>Route Summary</Text>
            <Text style={styles.reportDesc}>Length, nodes, closures</Text>
          </View>
        </TouchableOpacity>

        {selectedReport === 'route' && (
          <View style={styles.reportData}>
            {MOCK_ROUTES.map(route => (
              <View key={route.id} style={styles.dataRow}>
                <Text style={styles.dataLabel}>{route.name}</Text>
                <Text style={styles.dataValue}>{route.length}km • {route.nodes} nodes • {route.closures} closures</Text>
              </View>
            ))}
          </View>
        )}

        {/* Splice Reports */}
        <TouchableOpacity
          style={[styles.reportCard, selectedReport === 'splice' && styles.reportCardActive]}
          onPress={() => setSelectedReport('splice')}
        >
          <Text style={styles.reportIcon}>⚡</Text>
          <View style={styles.reportInfo}>
            <Text style={styles.reportName}>Splice Summary</Text>
            <Text style={styles.reportDesc}>Loss readings, fiber count</Text>
          </View>
        </TouchableOpacity>

        {selectedReport === 'splice' && (
          <View style={styles.reportData}>
            {MOCK_SPLICE_DATA.map((splice, idx) => (
              <View key={idx} style={styles.dataRow}>
                <Text style={styles.dataLabel}>{splice.closure}</Text>
                <Text style={styles.dataValue}>{splice.fibers}f • Avg: {splice.avgLoss}dB • Max: {splice.maxLoss}dB</Text>
              </View>
            ))}
          </View>
        )}

        {/* Closure Inventory */}
        <TouchableOpacity
          style={[styles.reportCard, selectedReport === 'closure' && styles.reportCardActive]}
          onPress={() => setSelectedReport('closure')}
        >
          <Text style={styles.reportIcon}>📦</Text>
          <View style={styles.reportInfo}>
            <Text style={styles.reportName}>Closure Inventory</Text>
            <Text style={styles.reportDesc}>Type, status, maintenance</Text>
          </View>
        </TouchableOpacity>

        {selectedReport === 'closure' && (
          <View style={styles.reportData}>
            {MOCK_CLOSURES.map(closure => (
              <View key={closure.id} style={styles.dataRow}>
                <Text style={styles.dataLabel}>{closure.type} • {closure.location}</Text>
                <Text style={styles.dataValue}>{closure.cores} cores • {closure.splices} splices • Status: {closure.status}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Power Chain */}
        <TouchableOpacity
          style={[styles.reportCard, selectedReport === 'power' && styles.reportCardActive]}
          onPress={() => setSelectedReport('power')}
        >
          <Text style={styles.reportIcon}>🔋</Text>
          <View style={styles.reportInfo}>
            <Text style={styles.reportName}>Power Chain Health</Text>
            <Text style={styles.reportDesc}>Input/output, losses</Text>
          </View>
        </TouchableOpacity>

        {selectedReport === 'power' && (
          <View style={styles.reportData}>
            {MOCK_POWER.map((power, idx) => (
              <View key={idx} style={styles.dataRow}>
                <Text style={styles.dataLabel}>{power.node}</Text>
                <Text style={styles.dataValue}>In: {power.powerIn}dBm • Out: {power.powerOut}dBm • Loss: {power.loss}dB</Text>
              </View>
            ))}
          </View>
        )}

        {/* Technician Report */}
        <TouchableOpacity
          style={[styles.reportCard, selectedReport === 'technician' && styles.reportCardActive]}
          onPress={() => setSelectedReport('technician')}
        >
          <Text style={styles.reportIcon}>👨‍🔧</Text>
          <View style={styles.reportInfo}>
            <Text style={styles.reportName}>Technician Report</Text>
            <Text style={styles.reportDesc}>Daily work summary</Text>
          </View>
        </TouchableOpacity>

        {selectedReport === 'technician' && (
          <View style={styles.reportData}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Jobs Completed</Text>
              <Text style={styles.dataValue}>5</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Total Hours</Text>
              <Text style={styles.dataValue}>8.5</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Routes Worked</Text>
              <Text style={styles.dataValue}>3</Text>
            </View>
          </View>
        )}

        {/* Export Options */}
        <Text style={styles.sectionTitle}>Export Report</Text>
        <TouchableOpacity style={styles.exportButton} onPress={() => handleExportCSV()}>
          <Text style={styles.exportButtonText}>📊 Export as CSV</Text>
          <Text style={styles.exportButtonDesc}>Spreadsheet format</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportButton} onPress={() => handleExportPDF()}>
          <Text style={styles.exportButtonText}>📄 Export as PDF</Text>
          <Text style={styles.exportButtonDesc}>Professional document</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.generateButton} onPress={() => handleGenerateReport(selectedReport)}>
          <Text style={styles.generateButtonText}>Generate {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.mutedForeground },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 12, marginTop: 16 },
  reportCard: { backgroundColor: colors.card, borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'transparent' },
  reportCardActive: { borderColor: colors.primary },
  reportIcon: { fontSize: 24 },
  reportInfo: { flex: 1 },
  reportName: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  reportDesc: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  reportData: { backgroundColor: colors.card, borderRadius: 8, padding: 12, marginBottom: 16 },
  dataRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  dataLabel: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  dataValue: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  exportButton: { backgroundColor: colors.card, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  exportButtonText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  exportButtonDesc: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  generateButton: { backgroundColor: colors.primary, borderRadius: 8, padding: 12, marginBottom: 24 },
  generateButtonText: { color: colors.background, fontWeight: '600', textAlign: 'center' },
});
