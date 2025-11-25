import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { offlineApi } from '../lib/offlineApiAdapter';
import { colors } from '../theme/colors';
import { updateJobStatus } from '../lib/jobManager';

interface JobDetailsScreenProps {
  jobId: number;
  onClose: () => void;
}

export function JobDetailsScreen({ jobId, onClose }: JobDetailsScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  const { data: job, isLoading } = useQuery({
    queryKey: ['/api/jobs', jobId],
    queryFn: () => offlineApi.getJob(jobId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateJobStatus(jobId, status as any),
    onSuccess: () => {
      Alert.alert('Success', 'Job status updated');
    },
  });

  const handleStatusChange = (newStatus: string) => {
    Alert.alert(
      'Update Status',
      `Change status to ${newStatus}?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        { text: 'Confirm', onPress: () => statusMutation.mutate(newStatus) },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading job details...</Text>
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

  const statusColor = {
    'Pending': colors.chart.amber,
    'In Progress': colors.chart.cyan,
    'Completed': colors.chart.green,
  }[job.status] || colors.muted;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.jobType}>{job.type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>

      {/* Job Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{job.address}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Scheduled Date</Text>
          <Text style={styles.value}>
            {new Date(job.scheduledDate).toLocaleDateString()}
          </Text>
        </View>

        {job.completedDate && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Completed Date</Text>
            <Text style={styles.value}>
              {new Date(job.completedDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Materials */}
      {(job.cableUsed || job.materialsUsed) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials</Text>
          {job.cableUsed && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Cable Used</Text>
              <Text style={styles.value}>{job.cableUsed} m</Text>
            </View>
          )}
          {job.materialsUsed && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Other Materials</Text>
              <Text style={styles.value}>{job.materialsUsed}</Text>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        {isEditing ? (
          <TextInput
            style={styles.notesInput}
            value={editedNotes}
            onChangeText={setEditedNotes}
            placeholder="Add notes..."
            placeholderTextColor={colors.mutedForeground}
            multiline
          />
        ) : (
          <Text style={styles.notes}>{job.notes || 'No notes'}</Text>
        )}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (isEditing) {
              setEditedNotes('');
            }
            setIsEditing(!isEditing);
          }}
        >
          <Text style={styles.buttonText}>
            {isEditing ? 'Done Editing' : 'Edit Notes'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Status</Text>
        <View style={styles.statusButtonsRow}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              job.status === 'In Progress' && styles.statusButtonActive,
              { borderColor: colors.chart.cyan },
            ]}
            onPress={() => handleStatusChange('In Progress')}
            disabled={statusMutation.isPending}
          >
            <Text
              style={[
                styles.statusButtonText,
                job.status === 'In Progress' && { color: colors.primaryForeground },
              ]}
            >
              Start
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusButton,
              job.status === 'Completed' && styles.statusButtonActive,
              { borderColor: colors.chart.green },
            ]}
            onPress={() => handleStatusChange('Completed')}
            disabled={statusMutation.isPending}
          >
            <Text
              style={[
                styles.statusButtonText,
                job.status === 'Completed' && { color: colors.primaryForeground },
              ]}
            >
              Complete
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={onClose}
      >
        <Text style={styles.buttonText}>Close</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  loadingText: {
    color: colors.mutedForeground,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  jobType: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  label: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: colors.foreground,
    fontSize: 14,
  },
  notes: {
    color: colors.foreground,
    fontSize: 14,
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: colors.background,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    minHeight: 80,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statusButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
  },
  statusButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: '600',
  },
});
