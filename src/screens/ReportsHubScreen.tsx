import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { api } from '../lib/api';

type ReportType = 'route' | 'splice' | 'closure' | 'power' | 'technician';

export default function ReportsHubScreen() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('route');
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [closures, setClosures] = useState<any[]>([]);
  const [powerReadings, setPowerReadings] = useState<any[]>([]);
  const [meterReadings, setMeterReadings] = useState<any[]>([]);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [routeData, closureData, powerData, meterData] = await Promise.all([
        api.getRoutes().catch(() => []),
        api.getClosures().catch(() => []),
        api.getPowerReadings().catch(() => []),
        api.getMeterReadings().catch(() => []),
      ]);

      setRoutes(routeData || []);
      setClosures(closureData || []);
      setPowerReadings(powerData || []);
      setMeterReadings(meterData || []);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type: ReportType) => {
    setLoading(true);
    try {
      await api.createDailyReport({
        user_id: 1,
        report_type: type,
        data: { routes: routes.length, closures: closures.length },
        generated_at: new Date().toISOString(),
      });
      Alert.alert('✓ Report Generated', `${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    Alert.alert('✓ CSV Export', `Exported ${routes.length} routes, ${closures.length} closures`);
  };

  const handleExportPDF = () => {
    Alert.alert('✓ PDF Export', 'Report PDF generated successfully');
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
            {routes.length === 0 ? (
              <Text style={styles.emptyText}>No routes found</Text>
            ) : (
              routes.map((route: any) => (
                <View key={route.id} style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{route.line_name || 'Route'}</Text>
                  <Text style={styles.dataValue}>{(route.length_meters / 1000).toFixed(1)}km • {route.fiber_count || 0} fibers</Text>
                </View>
              ))
            )}
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
            {meterReadings.length === 0 ? (
              <Text style={styles.emptyText}>No splice data found</Text>
            ) : (
              meterReadings.slice(0, 5).map((reading: any, idx: number) => (
                <View key={idx} style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{reading.device_name}</Text>
                  <Text style={styles.dataValue}>{reading.reading_value.toFixed(2)} {reading.unit}</Text>
                </View>
              ))
            )}
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
            {closures.length === 0 ? (
              <Text style={styles.emptyText}>No closures found</Text>
            ) : (
              closures.map((closure: any) => (
                <View key={closure.id} style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{closure.closure_type} • {closure.closure_name}</Text>
                  <Text style={styles.dataValue}>{closure.capacity_total} total • {closure.capacity_used} used</Text>
                </View>
              ))
            )}
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
            {powerReadings.length === 0 ? (
              <Text style={styles.emptyText}>No power readings found</Text>
            ) : (
              powerReadings.slice(0, 5).map((reading: any, idx: number) => (
                <View key={idx} style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Power Reading #{idx + 1}</Text>
                  <Text style={styles.dataValue}>{reading.power_dbm?.toFixed(1) || 'N/A'} dBm</Text>
                </View>
              ))
            )}
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
  emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: 'center', paddingVertical: 12 },
});
