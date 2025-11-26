import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { colors } from '../theme/colors';
import { estimateCableNeeded, estimateCompletionTime } from '../lib/jobManager';

interface JobFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gpsRoute?: [number, number][];
  selectedNodeIds?: number[];
}

export function JobFormModal({
  visible,
  onClose,
  onSuccess,
  gpsRoute = [],
  selectedNodeIds = [],
}: JobFormModalProps) {
  const [jobType, setJobType] = useState('Installation');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');

  const routeDistance = gpsRoute.length > 1
    ? gpsRoute.reduce((sum, _, i) => {
        if (i === 0) return 0;
        const lat1 = gpsRoute[i - 1][0];
        const lng1 = gpsRoute[i - 1][1];
        const lat2 = gpsRoute[i][0];
        const lng2 = gpsRoute[i][1];
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return sum + (R * c);
      }, 0)
    : 0;

  const estimatedCable = estimateCableNeeded(routeDistance);
  const estimatedTime = estimateCompletionTime(routeDistance, selectedNodeIds.length);

  const createJobMutation = useMutation({
    mutationFn: async () => {
      if (!address.trim()) {
        Alert.alert('Error', 'Please enter a job address');
        return;
      }

      const jobData = {
        type: jobType,
        address: address.trim(),
        status: 'Pending',
        scheduledDate: new Date().toISOString(),
        notes: notes.trim() || undefined,
        materialsUsed: materialsUsed.trim() || undefined,
        cableUsed: estimatedCable.toString(),
        clientId: 1,
        technicianId: 1,
      };

      const job = await api.createJob(jobData);

      // Save fiber route if available
      if (gpsRoute.length > 1) {
        await api.saveFiberRoute({
          name: `${jobType} - ${address}`,
          routeType: 'GPS',
          coordinates: gpsRoute,
          distance: routeDistance,
          jobId: job.id,
        });
      }

      return job;
    },
    onSuccess: (job) => {
      Alert.alert('Success', `Job created: ${job.id}`);
      setJobType('Installation');
      setAddress('');
      setNotes('');
      setMaterialsUsed('');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create job');
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Job</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Job Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Job Type</Text>
            <View style={styles.typeButtonsRow}>
              {['Installation', 'Maintenance', 'Repair', 'Inspection'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    jobType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setJobType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      jobType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.label}>Job Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter job address"
              placeholderTextColor={colors.mutedForeground}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* Route Summary */}
          {gpsRoute.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>Route Summary</Text>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                  GPS Points: {gpsRoute.length}
                </Text>
                <Text style={styles.summaryText}>
                  Distance: {routeDistance.toFixed(2)} km
                </Text>
                <Text style={styles.summaryText}>
                  Est. Cable: {estimatedCable} m
                </Text>
                <Text style={styles.summaryText}>
                  Est. Time: {estimatedTime} min
                </Text>
              </View>
            </View>
          )}

          {/* Selected Nodes */}
          {selectedNodeIds.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>
                Selected Nodes ({selectedNodeIds.length})
              </Text>
              <View style={styles.nodesBox}>
                <Text style={styles.nodesText}>
                  Node IDs: {selectedNodeIds.join(', ')}
                </Text>
              </View>
            </View>
          )}

          {/* Materials */}
          <View style={styles.section}>
            <Text style={styles.label}>Materials Used</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Fiber optic cable, connectors"
              placeholderTextColor={colors.mutedForeground}
              value={materialsUsed}
              onChangeText={setMaterialsUsed}
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Add job notes..."
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              createJobMutation.isPending && styles.createButtonDisabled,
            ]}
            onPress={() => createJobMutation.mutate()}
            disabled={createJobMutation.isPending}
          >
            <Text style={styles.createButtonText}>
              {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  title: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: colors.mutedForeground,
    fontSize: 24,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    color: colors.foreground,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: colors.primaryForeground,
  },
  summaryBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
  },
  summaryText: {
    color: colors.foreground,
    fontSize: 13,
    marginBottom: 6,
  },
  nodesBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
  },
  nodesText: {
    color: colors.foreground,
    fontSize: 13,
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
