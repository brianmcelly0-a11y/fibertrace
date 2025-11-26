import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, TextInput } from 'react-native';
import { colors } from '../theme/colors';
import * as JobManagement from '@/lib/jobManagement';

interface JobDetailsScreenProps {
  jobId?: string;
  onBack?: () => void;
  onComplete?: () => void;
}

export default function JobDetailsScreen({ jobId, onBack, onComplete }: JobDetailsScreenProps) {
  const [job, setJob] = useState<JobManagement.Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from backend via offlineApi
      const mockJob: JobManagement.Job = {
        id: jobId || 'job-1',
        jobId: 'JOB-001',
        name: 'Fiber Installation - Main Street',
        description: 'Install fiber optic cable from OLT to residential area',
        status: 'Pending',
        priority: 'High',
        assignedTechnician: 'tech@example.com',
        nodeIds: ['node-1', 'node-2'],
        routeIds: ['route-1'],
        scheduledDate: new Date().toISOString(),
        scheduledTime: '10:00',
        duration: 0,
        estimatedDuration: 7200,
        materialRequired: [{ itemId: 'cable-001', quantity: 500 }],
        estimatedCost: 500,
        notes: '',
        inlineNotes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        unsyncedChanges: false,
      };
      setJob(mockJob);
      setNotes(mockJob.notes);
    } catch (error) {
      Alert.alert('Error', 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: JobManagement.JobStatus) => {
    if (job) {
      const updated = JobManagement.updateJobStatus(job, newStatus);
      setJob(updated);
    }
  };

  const handleAddNote = () => {
    if (job && notes.trim()) {
      const updated = JobManagement.addInlineNote(job, notes, 'Current User');
      setJob(updated);
      setNotes('');
      Alert.alert('Success', 'Note added');
    }
  };

  const handleCompleteJob = () => {
    if (job) {
      const completionData: JobManagement.CompletionData = {
        durationSeconds: job.duration || 0,
        actualCost: job.actualCost || job.estimatedCost,
        notes: job.notes,
        signedBy: 'Current User',
      };
      const completed = JobManagement.completeJob(job, completionData);
      setJob(completed);
      Alert.alert('Success', 'Job marked as completed');
      onComplete?.();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Job not found</Text>
      </View>
    );
  }

  const statusColors: Record<JobManagement.JobStatus, string> = {
    'In Progress': colors.chart.green,
    'Pending': colors.chart.amber,
    'Completed': colors.mutedForeground,
    'On Hold': colors.destructive,
    'Cancelled': colors.destructive,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{job.name}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.label}>ID</Text>
            <Text style={styles.value}>{job.jobId}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[job.status] }]}>
            <Text style={styles.statusText}>{job.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <DetailRow label="Description" value={job.description} />
        <DetailRow label="Scheduled" value={new Date(job.scheduledDate).toLocaleDateString()} />
        <DetailRow label="Est. Duration" value={`${(job.estimatedDuration / 3600).toFixed(1)}h`} />
        <DetailRow label="Est. Cost" value={`$${job.estimatedCost}`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.input}
          placeholder="Add note..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity style={styles.button} onPress={handleAddNote}>
          <Text style={styles.buttonText}>Add Note</Text>
        </TouchableOpacity>
      </View>

      {job.inlineNotes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {job.inlineNotes.map(note => (
            <View key={note.id} style={styles.noteItem}>
              <Text style={styles.noteAuthor}>{note.author}</Text>
              <Text style={styles.noteText}>{note.text}</Text>
            </View>
          ))}
        </View>
      )}

      {job.status !== 'Completed' && (
        <View style={styles.actionsContainer}>
          {job.status === 'Pending' && (
            <TouchableOpacity style={styles.primaryButton} onPress={() => handleStatusChange('In Progress')}>
              <Text style={styles.buttonText}>Start Job</Text>
            </TouchableOpacity>
          )}
          {job.status === 'In Progress' && (
            <TouchableOpacity style={styles.successButton} onPress={handleCompleteJob}>
              <Text style={styles.buttonText}>Complete Job</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
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
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 14, color: colors.primary, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.foreground },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.background },
  label: { fontSize: 12, color: colors.mutedForeground },
  value: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 13, color: colors.mutedForeground },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 10, color: colors.foreground, minHeight: 80, textAlignVertical: 'top', marginBottom: 8 },
  button: { backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  buttonText: { fontSize: 14, fontWeight: '600', color: colors.background },
  noteItem: { backgroundColor: colors.card, padding: 10, borderRadius: 6, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: colors.primary },
  noteAuthor: { fontSize: 12, fontWeight: '600', color: colors.primary },
  noteText: { fontSize: 13, color: colors.foreground, marginTop: 4 },
  actionsContainer: { padding: 16, gap: 8 },
  primaryButton: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  successButton: { backgroundColor: colors.chart.green, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  spacer: { height: 20 },
  loadingText: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginTop: 40 },
  errorText: { fontSize: 14, color: colors.destructive, textAlign: 'center', marginTop: 40 },
});
