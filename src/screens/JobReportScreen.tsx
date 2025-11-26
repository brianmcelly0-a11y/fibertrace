import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { colors } from '../theme/colors';
import * as JobManagement from '@/lib/jobManagement';

interface JobReportScreenProps {
  job: JobManagement.Job;
}

export default function JobReportScreen({ job }: JobReportScreenProps) {
  const report = JobManagement.generateCompletionReport(job);

  const handleShare = async () => {
    try {
      const reportText = `
JOB COMPLETION REPORT
=====================
Job ID: ${report.jobId}
Name: ${report.name}
Technician: ${report.technician}

METRICS
-------
Duration: ${report.duration}
Cost Variance: ${report.costVariance}
Materials Used: ${report.materialUsed}
Status: ${report.status}
      `.trim();

      await Share.share({
        message: reportText,
        title: `Job Report - ${report.jobId}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleExport = async () => {
    // In real app, would generate PDF or CSV
    const csvContent = `Job ID,Name,Technician,Duration,Cost,Status
${report.jobId},"${report.name}","${report.technician}","${report.duration}","${report.costVariance}","${report.status}"`;
    
    console.log('Export CSV:', csvContent);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Completion Report</Text>
        <Text style={styles.subtitle}>{report.jobId}</Text>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Job Information" />
        <InfoRow label="Name" value={report.name} />
        <InfoRow label="Technician" value={report.technician} />
        <InfoRow label="Status" value={report.status} highlight />
      </View>

      <View style={styles.section}>
        <SectionTitle title="Performance Metrics" />
        <InfoRow label="Duration" value={report.duration} />
        <InfoRow label="Cost Variance" value={report.costVariance} />
        <InfoRow label="Materials Used" value={`${report.materialUsed} items`} />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <SummaryItem 
          label="Efficiency" 
          value={calculateEfficiency(job)} 
          color={job.duration <= job.estimatedDuration ? colors.chart.green : colors.chart.amber}
        />
        <SummaryItem 
          label="Cost Status" 
          value={job.actualCost && job.actualCost > job.estimatedCost ? 'Over Budget' : 'On Budget'}
          color={job.actualCost && job.actualCost > job.estimatedCost ? colors.destructive : colors.chart.green}
        />
        <SummaryItem 
          label="Quality" 
          value="Good"
          color={colors.chart.green}
        />
      </View>

      <View style={styles.notesCard}>
        <Text style={styles.notesTitle}>Completion Notes</Text>
        <Text style={styles.notesText}>{job.notes || 'No additional notes'}</Text>
      </View>

      {job.inlineNotes.length > 0 && (
        <View style={styles.section}>
          <SectionTitle title="Timeline Notes" />
          {job.inlineNotes.map(note => (
            <View key={note.id} style={styles.timelineItem}>
              <Text style={styles.timelineAuthor}>{note.author}</Text>
              <Text style={styles.timelineText}>{note.text}</Text>
              <Text style={styles.timelineTime}>{new Date(note.timestamp).toLocaleTimeString()}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Text style={styles.actionButtonText}>Share Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.exportButton]} onPress={handleExport}>
          <Text style={styles.actionButtonText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <View style={[styles.summaryValue, { backgroundColor: color }]}>
        <Text style={styles.summaryValueText}>{value}</Text>
      </View>
    </View>
  );
}

function calculateEfficiency(job: JobManagement.Job): string {
  if (!job.duration) return 'Pending';
  const ratio = job.duration / job.estimatedDuration;
  if (ratio <= 0.9) return 'Excellent';
  if (ratio <= 1.0) return 'Good';
  if (ratio <= 1.2) return 'Fair';
  return 'Needs Review';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.foreground },
  subtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 13, color: colors.mutedForeground },
  infoValue: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  infoValueHighlight: { color: colors.primary },
  summaryCard: { marginHorizontal: 16, marginVertical: 12, padding: 16, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: colors.mutedForeground },
  summaryValue: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  summaryValueText: { fontSize: 12, fontWeight: '600', color: colors.background },
  notesCard: { marginHorizontal: 16, marginVertical: 12, padding: 16, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  notesTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
  notesText: { fontSize: 13, color: colors.mutedForeground, lineHeight: 20 },
  timelineItem: { backgroundColor: colors.card, padding: 12, borderRadius: 6, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: colors.primary },
  timelineAuthor: { fontSize: 12, fontWeight: '600', color: colors.primary },
  timelineText: { fontSize: 13, color: colors.foreground, marginTop: 4 },
  timelineTime: { fontSize: 11, color: colors.mutedForeground, marginTop: 4 },
  actionsContainer: { flexDirection: 'row', gap: 8, padding: 16 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 6, backgroundColor: colors.primary, alignItems: 'center' },
  exportButton: { backgroundColor: colors.chart.green },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: colors.background },
  spacer: { height: 20 },
});
