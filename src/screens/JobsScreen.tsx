import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { offlineApi } from '../lib/offlineApiAdapter';
import { colors } from '../theme/colors';
import { JobDetailsScreen } from './JobDetailsScreen';

export function JobsScreen() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: () => offlineApi.getJobs(),
  });

  const statusColors: Record<string, string> = {
    Pending: '#f59e0b',
    'In Progress': '#3b82f6',
    Completed: '#10b981',
  };

  const JobCard = ({ job }: { job: any }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => setSelectedJobId(job.id)}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobType}>{job.type}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[job.status] || colors.muted },
          ]}
        >
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>
      <Text style={styles.jobAddress}>{job.address}</Text>
      <Text style={styles.jobDate}>
        Scheduled: {new Date(job.scheduledDate).toLocaleDateString()}
      </Text>
      {job.notes && <Text style={styles.jobNotes}>{job.notes}</Text>}
      <Text style={styles.tapHint}>Tap to view details →</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No jobs yet</Text>
          <Text style={styles.emptySubtext}>Create a job from the map</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <JobCard job={item} />}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={() => refetch()}
        />
      )}

      {/* Job Details Modal */}
      {selectedJobId && (
        <Modal
          visible={selectedJobId !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedJobId(null)}
        >
          <JobDetailsScreen
            jobId={selectedJobId}
            onClose={() => {
              setSelectedJobId(null);
              refetch();
            }}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.mutedForeground,
    fontSize: 16,
  },
  emptyText: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobType: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  jobAddress: {
    color: colors.foreground,
    fontSize: 14,
    marginBottom: 4,
  },
  jobDate: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 8,
  },
  jobNotes: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  tapHint: {
    color: colors.primary,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
