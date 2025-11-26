import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme/colors';

export default function UserProfileScreen() {
  const [user] = useState({
    id: 'tech-001',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'Technician',
    phone: '+1 (555) 123-4567',
    department: 'Field Operations',
    location: 'New York City',
    jobsCompleted: 127,
    hoursLogged: 892,
    specializations: ['Splicing', 'Testing', 'Installation'],
    joinDate: 'January 2023',
  });

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.split(' ').map(n => n[0]).join('')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
          <Text style={styles.userId}>ID: {user.id}</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatBox label="Jobs Completed" value={user.jobsCompleted.toString()} color={colors.chart.cyan} />
        <StatBox label="Hours Logged" value={user.hoursLogged.toString()} color={colors.chart.green} />
        <StatBox label="Rating" value="4.9★" color={colors.chart.amber} />
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <InfoField label="Email" value={user.email} />
        <InfoField label="Phone" value={user.phone} />
        <InfoField label="Department" value={user.department} />
        <InfoField label="Location" value={user.location} />
      </View>

      {/* Professional Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Info</Text>
        <InfoField label="Role" value={user.role} />
        <InfoField label="Joined" value={user.joinDate} />
        <InfoField label="Experience" value="3+ years" />
      </View>

      {/* Specializations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specializations</Text>
        <View style={styles.tagsContainer}>
          {user.specializations.map((spec, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{spec}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Team */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Information</Text>
        <TeamMember name="Sarah Lee" role="Team Lead" status="Online" />
        <TeamMember name="Mike Johnson" role="Technician" status="Offline" />
        <TeamMember name="Jane Smith" role="Technician" status="Online" />
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon')}>
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.chart.green + '20' }]} onPress={() => Alert.alert('Success', 'Credentials updated')}>
          <Text style={[styles.actionButtonText, { color: colors.chart.green }]}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.destructive + '20' }]} onPress={() => Alert.alert('Logged Out', 'You have been logged out')}>
          <Text style={[styles.actionButtonText, { color: colors.destructive }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statBox, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoField}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function TeamMember({ name, role, status }: { name: string; role: string; status: string }) {
  const isOnline = status === 'Online';
  return (
    <View style={styles.teamMember}>
      <View style={styles.memberInfo}>
        <View style={[styles.memberAvatar, { backgroundColor: isOnline ? colors.chart.green : colors.border }]}>
          <Text style={styles.memberAvatarText}>{name[0]}</Text>
        </View>
        <View>
          <Text style={styles.memberName}>{name}</Text>
          <Text style={styles.memberRole}>{role}</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: isOnline ? colors.chart.green + '20' : colors.border }]}>
        <Text style={[styles.statusText, { color: isOnline ? colors.chart.green : colors.mutedForeground }]}>
          {status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingBottom: 20 },
  profileHeader: { flexDirection: 'row', padding: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: '600', color: colors.background },
  userName: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  userRole: { fontSize: 12, color: colors.chart.cyan, marginTop: 2 },
  userId: { fontSize: 10, color: colors.mutedForeground, marginTop: 2 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 16, gap: 8 },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: 6, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.primary },
  statValue: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  statLabel: { fontSize: 10, color: colors.mutedForeground, marginTop: 4 },
  section: { paddingHorizontal: 12, paddingVertical: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: 12, textTransform: 'uppercase' },
  infoField: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 11, color: colors.mutedForeground, marginBottom: 4 },
  infoValue: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  tagsContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.primary },
  tagText: { fontSize: 10, fontWeight: '600', color: colors.primary },
  teamMember: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  memberInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  memberAvatarText: { fontSize: 12, fontWeight: '600', color: colors.background },
  memberName: { fontSize: 11, fontWeight: '600', color: colors.foreground },
  memberRole: { fontSize: 9, color: colors.mutedForeground },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: '600' },
  actionButton: { marginVertical: 6, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 6, alignItems: 'center' },
  actionButtonText: { fontSize: 12, fontWeight: '600', color: colors.background },
});
