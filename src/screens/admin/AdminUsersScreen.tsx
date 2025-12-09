import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { localDataService } from '../../services/LocalDataService';
import { User } from '../../lib/database';

interface Props {}

export function AdminUsersScreen({}: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'Technician' as User['role'],
    phone: '',
  });

  const roles: User['role'][] = ['Admin', 'Manager', 'Technician', 'Viewer'];

  const loadUsers = async () => {
    try {
      let loadedUsers = await localDataService.getUsers();
      
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        loadedUsers = loadedUsers.filter(u => 
          u.email.toLowerCase().includes(search) ||
          u.full_name.toLowerCase().includes(search)
        );
      }
      
      if (filterRole) {
        loadedUsers = loadedUsers.filter(u => u.role === filterRole);
      }
      
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchQuery, filterRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.fullName || !newUser.password) {
      Alert.alert('Error', 'Email, name, and password are required');
      return;
    }

    const organizationId = localDataService.getCurrentOrganizationId();
    if (!organizationId) {
      Alert.alert('Error', 'No organization context');
      return;
    }

    try {
      await localDataService.createUser({
        organizationId,
        email: newUser.email,
        password: newUser.password,
        fullName: newUser.fullName,
        role: newUser.role,
        phone: newUser.phone || undefined,
      });
      
      setShowAddModal(false);
      setNewUser({
        email: '',
        fullName: '',
        password: '',
        role: 'Technician',
        phone: '',
      });
      await loadUsers();
      Alert.alert('Success', 'User created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await localDataService.updateUser(selectedUser.id, {
        full_name: selectedUser.full_name,
        role: selectedUser.role,
        phone: selectedUser.phone,
        is_active: selectedUser.is_active,
      });
      
      setShowEditModal(false);
      setSelectedUser(null);
      await loadUsers();
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await localDataService.updateUser(user.id, {
        is_active: !user.is_active,
      });
      await loadUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const handleToggleOTP = async (user: User) => {
    if (user.otp_enabled) {
      Alert.alert(
        'Disable OTP',
        'Are you sure you want to disable two-factor authentication for this user?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disable', 
            style: 'destructive',
            onPress: async () => {
              await localDataService.disableOTP(user.id);
              await loadUsers();
            }
          },
        ]
      );
    } else {
      Alert.alert('Info', 'User can enable OTP from their profile settings');
    }
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'Admin': return colors.destructive;
      case 'Manager': return colors.chart.purple;
      case 'Technician': return colors.chart.blue;
      default: return colors.mutedForeground;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+ Invite User</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilters}>
        <TouchableOpacity
          style={[styles.filterChip, !filterRole && styles.filterChipActive]}
          onPress={() => setFilterRole(null)}
        >
          <Text style={[styles.filterChipText, !filterRole && styles.filterChipTextActive]}>All Roles</Text>
        </TouchableOpacity>
        {roles.map(role => (
          <TouchableOpacity
            key={role}
            style={[styles.filterChip, filterRole === role && styles.filterChipActive]}
            onPress={() => setFilterRole(role)}
          >
            <Text style={[styles.filterChipText, filterRole === role && styles.filterChipTextActive]}>{role}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {users.map(user => (
          <TouchableOpacity
            key={user.id}
            style={styles.userCard}
            onPress={() => {
              setSelectedUser(user);
              setShowEditModal(true);
            }}
          >
            <View style={styles.userHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.full_name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.full_name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role) + '20' }]}>
                <Text style={[styles.roleText, { color: getRoleBadgeColor(user.role) }]}>{user.role}</Text>
              </View>
            </View>
            
            <View style={styles.userMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status:</Text>
                <Text style={[styles.metaValue, { color: user.is_active ? colors.chart.green : colors.destructive }]}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>OTP:</Text>
                <Text style={[styles.metaValue, { color: user.otp_enabled ? colors.chart.green : colors.mutedForeground }]}>
                  {user.otp_enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              {user.phone && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Phone:</Text>
                  <Text style={styles.metaValue}>{user.phone}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
        
        {users.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite New User</Text>

            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              value={newUser.email}
              onChangeText={v => setNewUser({ ...newUser, email: v })}
              placeholder="user@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={newUser.fullName}
              onChangeText={v => setNewUser({ ...newUser, fullName: v })}
              placeholder="John Doe"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={styles.inputLabel}>Temporary Password *</Text>
            <TextInput
              style={styles.input}
              value={newUser.password}
              onChangeText={v => setNewUser({ ...newUser, password: v })}
              placeholder="Temporary password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              value={newUser.phone}
              onChangeText={v => setNewUser({ ...newUser, phone: v })}
              placeholder="+1 234 567 8900"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.roleSelector}>
              {roles.map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleOption, newUser.role === role && styles.roleOptionActive]}
                  onPress={() => setNewUser({ ...newUser, role })}
                >
                  <Text style={[styles.roleOptionText, newUser.role === role && styles.roleOptionTextActive]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleAddUser}>
                <Text style={styles.confirmButtonText}>Invite User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit User</Text>
            
            {selectedUser && (
              <>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={selectedUser.full_name}
                  onChangeText={v => setSelectedUser({ ...selectedUser, full_name: v })}
                  placeholderTextColor={colors.mutedForeground}
                />

                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={selectedUser.email}
                  editable={false}
                />

                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={selectedUser.phone || ''}
                  onChangeText={v => setSelectedUser({ ...selectedUser, phone: v })}
                  placeholder="Phone number"
                  placeholderTextColor={colors.mutedForeground}
                />

                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleSelector}>
                  {roles.map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleOption, selectedUser.role === role && styles.roleOptionActive]}
                      onPress={() => setSelectedUser({ ...selectedUser, role })}
                    >
                      <Text style={[styles.roleOptionText, selectedUser.role === role && styles.roleOptionTextActive]}>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Account Active</Text>
                  <TouchableOpacity
                    style={[styles.toggle, selectedUser.is_active && styles.toggleActive]}
                    onPress={() => setSelectedUser({ ...selectedUser, is_active: !selectedUser.is_active })}
                  >
                    <Text style={styles.toggleText}>{selectedUser.is_active ? 'Yes' : 'No'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Two-Factor Auth</Text>
                  <TouchableOpacity
                    style={[styles.toggle, selectedUser.otp_enabled && styles.toggleActive]}
                    onPress={() => handleToggleOTP(selectedUser)}
                  >
                    <Text style={styles.toggleText}>{selectedUser.otp_enabled ? 'Enabled' : 'Disabled'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleUpdateUser}>
                <Text style={styles.confirmButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    padding: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
  searchBar: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleFilters: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: colors.background,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.background,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  userEmail: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginRight: 4,
  },
  metaValue: {
    fontSize: 13,
    color: colors.foreground,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledInput: {
    opacity: 0.6,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleOption: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleOptionText: {
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  roleOptionTextActive: {
    color: colors.background,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.foreground,
  },
  toggle: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleActive: {
    backgroundColor: colors.chart.green,
    borderColor: colors.chart.green,
  },
  toggleText: {
    color: colors.foreground,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.foreground,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
});

export default AdminUsersScreen;
