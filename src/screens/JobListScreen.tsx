import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, StyleSheet, TextInput } from 'react-native';
import { colors } from '../theme/colors';
import * as JobManagement from '@/lib/jobManagement';

interface JobListScreenProps {
  onSelectJob?: (jobId: string) => void;
}

export default function JobListScreen({ onSelectJob }: JobListScreenProps) {
  const [jobs, setJobs] = useState<JobManagement.Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobManagement.Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobManagement.JobStatus | 'All'>('All');

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, searchQuery, statusFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from backend
      const mockJobs: JobManagement.Job[] = [];
      const loaded = JobManagement.loadJobs(mockJobs);
      setJobs(loaded);
    } catch (error) {
      Alert.alert('Error', 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    if (statusFilter !== 'All') {
      filtered = JobManagement.filterJobsByStatus(filtered, statusFilter);
    }

    if (searchQuery.trim()) {
      filtered = JobManagement.searchJobs(filtered, searchQuery);
    }

    setFilteredJobs(filtered);
  };

  const getStatusColor = (status: JobManagement.JobStatus) => {
    switch (status) {
      case 'In Progress':
        return colors.chart.green;
      case 'Pending':
        return colors.chart.amber;
      case 'Completed':
        return colors.mutedForeground;
      case 'On Hold':
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const getPriorityColor = (priority: JobManagement.JobPriority) => {
    switch (priority) {
      case 'Critical':
        return colors.destructive;
      case 'High':
        return colors.chart.amber;
      case 'Medium':
        return colors.primary;
      default:
        return colors.mutedForeground;
    }
  };

  const JobCard = ({ job }: { job: JobManagement.Job }) => (
    <TouchableOpacity
      style={[styles.jobCard, { borderLeftColor: getPriorityColor(job.priority) }]}
      onPress={() => onSelectJob?.(job.id)}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleSection}>
          <Text style={styles.jobTitle}>{job.name}</Text>
          <Text style={styles.jobId}>{job.jobId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>

      <Text style={styles.description}>{job.description}</Text>

      <View style={styles.jobMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Scheduled</Text>
          <Text style={styles.metaValue}>{new Date(job.scheduledDate).toLocaleDateString()}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Duration</Text>
          <Text style={styles.metaValue}>{(job.estimatedDuration / 3600).toFixed(1)}h</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Cost</Text>
          <Text style={styles.metaValue}>${job.estimatedCost.toFixed(2)}</Text>
        </View>
      </View>

      {job.unsyncedChanges && (
        <View style={styles.unsyncedBadge}>
          <Text style={styles.unsyncedText}>⚠ Not synced</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const stats = JobManagement.getJobStats(jobs);

  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.inProgressJobs}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.pendingJobs}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completedJobs}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['All', 'Pending', 'In Progress', 'Completed'] as const).map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, statusFilter === status && styles.filterTabActive]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[styles.filterTabText, statusFilter === status && styles.filterTabTextActive]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Job List */}
      <ScrollView
        style={styles.jobsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        ) : filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No jobs found</Text>
          </View>
        ) : (
          filteredJobs.map(job => <JobCard key={job.id} job={job} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.background,
  },
  jobsList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  jobCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitleSection: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  jobId: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.background,
  },
  description: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  unsyncedBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.destructive + '20',
    borderRadius: 4,
  },
  unsyncedText: {
    fontSize: 11,
    color: colors.destructive,
    fontWeight: '500',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.mutedForeground,
  },
});
