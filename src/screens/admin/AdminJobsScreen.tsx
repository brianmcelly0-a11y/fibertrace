import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { localDataService } from '../../services/LocalDataService';
import { Job, Announcement } from '../../lib/database';

type TabType = 'jobs' | 'announcements';

export function AdminJobsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    jobType: 'Installation',
    priority: 'Medium' as Job['priority'],
    scheduledDate: '',
    locationAddress: '',
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'Normal' as Announcement['priority'],
    targetRoles: ['Admin', 'Manager', 'Technician'] as string[],
  });

  const jobTypes = ['Installation', 'Repair', 'Maintenance', 'Survey', 'Upgrade', 'Other'];
  const priorities: Job['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
  const announcementPriorities: Announcement['priority'][] = ['Low', 'Normal', 'High', 'Urgent'];
  const allRoles = ['Admin', 'Manager', 'Technician', 'Viewer'];

  const loadData = async () => {
    try {
      const [loadedJobs, loadedAnnouncements] = await Promise.all([
        localDataService.getJobs(),
        localDataService.getAnnouncements(false),
      ]);
      setJobs(loadedJobs);
      setAnnouncements(loadedAnnouncements);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateJob = async () => {
    if (!newJob.title) {
      Alert.alert('Error', 'Job title is required');
      return;
    }

    try {
      await localDataService.createJob({
        title: newJob.title,
        description: newJob.description,
        jobType: newJob.jobType,
        priority: newJob.priority,
        scheduledDate: newJob.scheduledDate || undefined,
        locationAddress: newJob.locationAddress || undefined,
      });
      setShowJobModal(false);
      setNewJob({ title: '', description: '', jobType: 'Installation', priority: 'Medium', scheduledDate: '', locationAddress: '' });
      await loadData();
      Alert.alert('Success', 'Job created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create job');
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }

    try {
      await localDataService.createAnnouncement({
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        priority: newAnnouncement.priority,
        targetRoles: newAnnouncement.targetRoles,
      });
      setShowAnnouncementModal(false);
      setNewAnnouncement({ title: '', content: '', priority: 'Normal', targetRoles: ['Admin', 'Manager', 'Technician'] });
      await loadData();
      Alert.alert('Success', 'Announcement created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create announcement');
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'Completed': return colors.chart.green;
      case 'In Progress': return colors.chart.blue;
      case 'Assigned': return colors.chart.purple;
      case 'Cancelled': return colors.destructive;
      default: return colors.chart.amber;
    }
  };

  const getPriorityColor = (priority: Job['priority'] | Announcement['priority']) => {
    switch (priority) {
      case 'Critical':
      case 'Urgent': return colors.destructive;
      case 'High': return colors.chart.amber;
      case 'Medium':
      case 'Normal': return colors.chart.blue;
      default: return colors.mutedForeground;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{activeTab === 'jobs' ? 'Jobs' : 'Announcements'}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => activeTab === 'jobs' ? setShowJobModal(true) : setShowAnnouncementModal(true)}
        >
          <Text style={styles.addButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'jobs' && styles.tabActive]}
          onPress={() => setActiveTab('jobs')}
        >
          <Text style={[styles.tabText, activeTab === 'jobs' && styles.tabTextActive]}>Jobs ({jobs.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcements' && styles.tabActive]}
          onPress={() => setActiveTab('announcements')}
        >
          <Text style={[styles.tabText, activeTab === 'announcements' && styles.tabTextActive]}>
            Announcements ({announcements.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeTab === 'jobs' && jobs.map(job => (
          <View key={job.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.jobNumber}>{job.job_number}</Text>
              <View style={[styles.badge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(job.status) }]}>{job.status}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{job.title}</Text>
            <Text style={styles.cardSubtitle}>{job.job_type}</Text>
            {job.location_address && <Text style={styles.cardMeta}>{job.location_address}</Text>}
            <View style={styles.cardFooter}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(job.priority) }]}>{job.priority}</Text>
              </View>
              {job.scheduled_date && (
                <Text style={styles.dateText}>{new Date(job.scheduled_date).toLocaleDateString()}</Text>
              )}
            </View>
          </View>
        ))}

        {activeTab === 'announcements' && announcements.map(ann => (
          <View key={ann.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ann.priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(ann.priority) }]}>{ann.priority}</Text>
              </View>
              <Text style={[styles.activeStatus, { color: ann.is_active ? colors.chart.green : colors.mutedForeground }]}>
                {ann.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Text style={styles.cardTitle}>{ann.title}</Text>
            <Text style={styles.cardContent} numberOfLines={3}>{ann.content}</Text>
            <Text style={styles.dateText}>Created: {new Date(ann.created_at).toLocaleDateString()}</Text>
          </View>
        ))}

        {((activeTab === 'jobs' && jobs.length === 0) || (activeTab === 'announcements' && announcements.length === 0)) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No {activeTab} found</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showJobModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Job</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={newJob.title}
                onChangeText={v => setNewJob({ ...newJob, title: v })}
                placeholder="Job title"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newJob.description}
                onChangeText={v => setNewJob({ ...newJob, description: v })}
                placeholder="Job description"
                placeholderTextColor={colors.mutedForeground}
                multiline
              />

              <Text style={styles.inputLabel}>Job Type</Text>
              <View style={styles.chipContainer}>
                {jobTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, newJob.jobType === type && styles.chipActive]}
                    onPress={() => setNewJob({ ...newJob, jobType: type })}
                  >
                    <Text style={[styles.chipText, newJob.jobType === type && styles.chipTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.chipContainer}>
                {priorities.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, newJob.priority === p && styles.chipActive]}
                    onPress={() => setNewJob({ ...newJob, priority: p })}
                  >
                    <Text style={[styles.chipText, newJob.priority === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Location Address</Text>
              <TextInput
                style={styles.input}
                value={newJob.locationAddress}
                onChangeText={v => setNewJob({ ...newJob, locationAddress: v })}
                placeholder="Address"
                placeholderTextColor={colors.mutedForeground}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowJobModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleCreateJob}>
                <Text style={styles.confirmButtonText}>Create Job</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAnnouncementModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Announcement</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={newAnnouncement.title}
                onChangeText={v => setNewAnnouncement({ ...newAnnouncement, title: v })}
                placeholder="Announcement title"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>Content *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newAnnouncement.content}
                onChangeText={v => setNewAnnouncement({ ...newAnnouncement, content: v })}
                placeholder="Announcement content"
                placeholderTextColor={colors.mutedForeground}
                multiline
              />

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.chipContainer}>
                {announcementPriorities.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, newAnnouncement.priority === p && styles.chipActive]}
                    onPress={() => setNewAnnouncement({ ...newAnnouncement, priority: p })}
                  >
                    <Text style={[styles.chipText, newAnnouncement.priority === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Target Roles</Text>
              <View style={styles.chipContainer}>
                {allRoles.map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.chip, newAnnouncement.targetRoles.includes(role) && styles.chipActive]}
                    onPress={() => {
                      const roles = newAnnouncement.targetRoles.includes(role)
                        ? newAnnouncement.targetRoles.filter(r => r !== role)
                        : [...newAnnouncement.targetRoles, role];
                      setNewAnnouncement({ ...newAnnouncement, targetRoles: roles });
                    }}
                  >
                    <Text style={[styles.chipText, newAnnouncement.targetRoles.includes(role) && styles.chipTextActive]}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowAnnouncementModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleCreateAnnouncement}>
                <Text style={styles.confirmButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.foreground },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: colors.background, fontWeight: '600' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.mutedForeground, fontWeight: '500' },
  tabTextActive: { color: colors.primary },
  list: { flex: 1, paddingHorizontal: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  jobNumber: { fontSize: 12, color: colors.mutedForeground, fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: colors.mutedForeground, marginBottom: 4 },
  cardContent: { fontSize: 14, color: colors.mutedForeground, marginBottom: 8, lineHeight: 20 },
  cardMeta: { fontSize: 13, color: colors.mutedForeground, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  priorityText: { fontSize: 11, fontWeight: '600' },
  activeStatus: { fontSize: 12, fontWeight: '500' },
  dateText: { fontSize: 12, color: colors.mutedForeground },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: colors.mutedForeground, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.foreground, marginBottom: 16, textAlign: 'center' },
  modalScroll: { maxHeight: 400 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.background, borderRadius: 8, padding: 12, color: colors.foreground, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.mutedForeground, fontSize: 13 },
  chipTextActive: { color: colors.background },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelButtonText: { color: colors.foreground, fontWeight: '600' },
  confirmButton: { backgroundColor: colors.primary },
  confirmButtonText: { color: colors.background, fontWeight: '600' },
});

export default AdminJobsScreen;
